#include "Config.h"
#include "JsonResponse.h"
#include "LdapClient.h"
#include "RoleResolver.h"

#include <cstdlib>
#include <exception>
#include <optional>
#include <string>

namespace {

std::optional<std::string> envValue(const char* key) {
    if (const char* value = std::getenv(key); value && *value) return value;
    return std::nullopt;
}

std::string normalizeRemoteUser(std::string value) {
    const auto slash = value.find('\\');
    if (slash != std::string::npos) value = value.substr(slash + 1);
    const auto at = value.find('@');
    if (at != std::string::npos) value = value.substr(0, at);
    return value;
}

std::optional<std::string> detectRemoteUser() {
    for (const char* key : {"REMOTE_USER", "AUTH_USER", "LOGON_USER"}) {
        if (auto value = envValue(key)) return normalizeRemoteUser(*value);
    }
    return std::nullopt;
}

} // namespace

int main() {
    try {
        const auto username = detectRemoteUser();
        if (!username || username->empty()) {
            JsonResponse::writeJson(JsonResponse::manualLoginRequired());
            return 0;
        }

        Config config = Config::load();
        LdapClient ldap(config);
        RoleResolver resolver;
        const auto user = ldap.findUserWithServiceAccount(*username);
        const auto role = resolver.resolve(user.username, user.memberOf);

        if (!role) {
            JsonResponse::writeJson(JsonResponse::manualLoginRequired());
            return 0;
        }

        JsonResponse::writeJson(JsonResponse::roleOk("auto_login_ok", *role));
        return 0;
    } catch (const std::exception& ex) {
        const std::string message = ex.what();
        if (message.find("User not found") != std::string::npos) {
            JsonResponse::writeJson(JsonResponse::manualLoginRequired());
            return 0;
        }
        JsonResponse::writeJson(JsonResponse::adError("Could not contact Active Directory"));
        return 0;
    }
}
