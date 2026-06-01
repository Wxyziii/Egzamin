#pragma once

#include <string>

namespace AuditLogger {
void logLoginAttempt(const std::string& username,
                     bool success,
                     const std::string& role,
                     const std::string& ipAddress);
}
