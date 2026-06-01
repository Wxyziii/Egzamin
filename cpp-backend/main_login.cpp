#include "AuditLogger.h"
#include "Config.h"
#include "JsonResponse.h"
#include "LdapClient.h"
#include "RoleResolver.h"

#include <cstdlib>
#include <exception>
#include <iostream>
#include <sstream>
#include <string>

namespace {

std::string readRequestBody() {
    const char* lengthHeader = std::getenv("CONTENT_LENGTH");
    const int length = lengthHeader ? std::atoi(lengthHeader) : 0;
    if (length <= 0 || length > 16384) return "";

    std::string body(static_cast<size_t>(length), '\0');
    std::cin.read(body.data(), length);
    body.resize(static_cast<size_t>(std::cin.gcount()));
    return body;
}

std::string envValue(const char* key) {
    if (const char* value = std::getenv(key); value && *value) return value;
    return "";
}

std::string jsonField(const std::string& body, const std::string& field) {
    const std::string key = "\"" + field + "\"";
    auto pos = body.find(key);
    if (pos == std::string::npos) return "";
    pos = body.find(':', pos);
    if (pos == std::string::npos) return "";
    pos = body.find('"', pos);
    if (pos == std::string::npos) return "";
    ++pos;

    std::ostringstream value;
    bool escaped = false;
    for (; pos < body.size(); ++pos) {
        const char ch = body[pos];
        if (escaped) {
            value << ch;
            escaped = false;
        } else if (ch == '\\') {
            escaped = true;
        } else if (ch == '"') {
            break;
        } else {
            value << ch;
        }
    }
    return value.str();
}

} // namespace

int main() {
    std::string username;
    std::string clientIp = envValue("REMOTE_ADDR");
    try {
        const std::string body = readRequestBody();
        username = jsonField(body, "username");
        const std::string password = jsonField(body, "password");

        if (username.empty() || password.empty()) {
            AuditLogger::logLoginAttempt(username, false, "none", clientIp);
            JsonResponse::writeJson(JsonResponse::loginError("Username and password are required"));
            return 0;
        }

        Config config = Config::load();
        LdapClient ldap(config);
        RoleResolver resolver;
        const auto user = ldap.authenticateAndFindUser(username, password);
        const auto role = resolver.resolve(user.username, user.memberOf);

        if (!role) {
            AuditLogger::logLoginAttempt(username, false, "none", clientIp);
            JsonResponse::writeJson(JsonResponse::loginError("AD login succeeded, but no HelpDesk role group matched"));
            return 0;
        }

        AuditLogger::logLoginAttempt(user.username, true, role->role, clientIp);
        JsonResponse::writeJson(JsonResponse::roleOk("manual_login_ok", *role));
        return 0;
    } catch (const std::exception& ex) {
        AuditLogger::logLoginAttempt(username, false, "none", clientIp);
        const std::string message = ex.what();
        if (message.find("Invalid credentials") != std::string::npos ||
            message.find("User not found") != std::string::npos ||
            message.find("Password is required") != std::string::npos) {
            JsonResponse::writeJson(JsonResponse::loginError("Invalid AD username, password, or user lookup"));
            return 0;
        }
        JsonResponse::writeJson(JsonResponse::adError("Could not contact Active Directory"));
        return 0;
    }
}
