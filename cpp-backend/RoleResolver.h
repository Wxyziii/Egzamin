#pragma once

#include <optional>
#include <string>
#include <vector>

struct RoleResult {
    std::string username;
    std::string role;
    std::string matchedGroup;
};

class RoleResolver {
public:
    std::optional<RoleResult> resolve(const std::string& username,
                                      const std::vector<std::string>& memberOfDns) const;
};
