#include "AuditLogger.h"

#include <iostream>
#include <string>

namespace {

bool parseSuccess(const std::string& value) {
    return value == "success" || value == "ok" || value == "true" || value == "1";
}

} // namespace

int main(int argc, char* argv[]) {
    const std::string username = argc > 1 ? argv[1] : "support1";
    const bool success = argc > 2 ? parseSuccess(argv[2]) : true;
    const std::string role = argc > 3 ? argv[3] : (success ? "support" : "none");
    const std::string ipAddress = argc > 4 ? argv[4] : "local";

    AuditLogger::logLoginAttempt(username, success, role, ipAddress);

    std::cout << "Audit log written for user=" << username
              << " result=" << (success ? "success" : "failed")
              << " role=" << role
              << " ip=" << ipAddress
              << '\n';
    std::cout << "Default local log path: logs/helpdesk-auth.log\n";
    return 0;
}
