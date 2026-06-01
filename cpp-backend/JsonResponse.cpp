#include "JsonResponse.h"

#include "RoleResolver.h"

#include <iostream>
#include <sstream>

namespace JsonResponse {

std::string escape(const std::string& value) {
    std::ostringstream out;
    for (const char ch : value) {
        switch (ch) {
            case '\\': out << "\\\\"; break;
            case '"': out << "\\\""; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default: out << ch; break;
        }
    }
    return out.str();
}

std::string manualLoginRequired() {
    return "{\"status\":\"manual_login_required\",\"message\":\"Could not find AD role automatically\"}";
}

std::string adError(const std::string& message) {
    return "{\"status\":\"ad_error\",\"message\":\"" + escape(message) + "\"}";
}

std::string loginError(const std::string& message) {
    return "{\"status\":\"login_failed\",\"message\":\"" + escape(message) + "\"}";
}

std::string roleOk(const std::string& status, const RoleResult& result) {
    return "{"
        "\"status\":\"" + escape(status) + "\","
        "\"username\":\"" + escape(result.username) + "\","
        "\"role\":\"" + escape(result.role) + "\","
        "\"matchedGroup\":\"" + escape(result.matchedGroup) + "\","
        "\"source\":\"Active Directory\","
        "\"checkedBy\":\"C++ LDAP Role Resolver\""
        "}";
}

void writeJson(const std::string& json) {
    std::cout << "Content-Type: application/json\r\n";
    std::cout << "Cache-Control: no-store\r\n\r\n";
    std::cout << json;
}

} // namespace JsonResponse
