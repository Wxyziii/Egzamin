#include "RoleResolver.h"

#include <algorithm>
#include <cctype>
#include <string>
#include <vector>

namespace {

std::string lower(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char ch) {
        return static_cast<char>(std::tolower(ch));
    });
    return value;
}

bool dnContainsCn(const std::string& dn, const std::string& cn) {
    const std::string needle = "cn=" + lower(cn);
    return lower(dn).find(needle) != std::string::npos;
}

} // namespace

std::optional<RoleResult> RoleResolver::resolve(const std::string& username,
                                                const std::vector<std::string>& memberOfDns) const {
    struct Mapping {
        const char* group;
        const char* role;
    };

    // EXAM LIVE CODING AREA:
    // This is the part I can explain and edit in front of the sensor.
    // The frontend never chooses roles. AD group membership is mapped here.
    const std::vector<Mapping> mappings = {
        {"GG_HelpDesk_Admin", "admin"},
        {"GG_HelpDesk_Support", "support"},
        {"GG_HelpDesk_User", "user"}
    };

    for (const auto& mapping : mappings) {
        for (const auto& groupDn : memberOfDns) {
            if (dnContainsCn(groupDn, mapping.group)) {
                return RoleResult{username, mapping.role, mapping.group};
            }
        }
    }

    return std::nullopt;
}
