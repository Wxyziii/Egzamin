#include "AuditLogger.h"

#include <chrono>
#include <ctime>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <sstream>

namespace {

std::string timestamp() {
    const auto now = std::chrono::system_clock::now();
    const std::time_t time = std::chrono::system_clock::to_time_t(now);

    std::tm localTime{};
#ifdef _WIN32
    localtime_s(&localTime, &time);
#else
    localtime_r(&time, &localTime);
#endif

    std::ostringstream out;
    out << std::put_time(&localTime, "%Y-%m-%d %H:%M:%S");
    return out.str();
}

std::string clean(const std::string& value) {
    std::string result;
    result.reserve(value.size());
    for (const char ch : value) {
        if (ch == '\n' || ch == '\r' || ch == '|') {
            result.push_back('_');
        } else {
            result.push_back(ch);
        }
    }
    return result;
}

std::filesystem::path logPath() {
    if (const char* configuredPath = std::getenv("HELPDESK_AUTH_LOG"); configuredPath && *configuredPath) {
        return configuredPath;
    }
    return std::filesystem::path("logs") / "helpdesk-auth.log";
}

} // namespace

namespace AuditLogger {

void logLoginAttempt(const std::string& username,
                     bool success,
                     const std::string& role,
                     const std::string& ipAddress) {
    const auto path = logPath();
    if (path.has_parent_path()) {
        std::error_code ignored;
        std::filesystem::create_directories(path.parent_path(), ignored);
    }

    std::ofstream log(path, std::ios::app);
    if (!log) return;

    log << timestamp()
        << " | user=" << clean(username.empty() ? "<empty>" : username)
        << " | result=" << (success ? "success" : "failed")
        << " | role=" << clean(role.empty() ? "none" : role)
        << " | ip=" << clean(ipAddress.empty() ? "unknown" : ipAddress)
        << '\n';
}

} // namespace AuditLogger
