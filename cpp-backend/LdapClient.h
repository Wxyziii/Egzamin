#pragma once

#include "Config.h"

#include <optional>
#include <string>
#include <vector>

struct LdapUser {
    std::string username;
    std::string dn;
    std::vector<std::string> memberOf;
};

class LdapClient {
public:
    explicit LdapClient(Config config);

    LdapUser findUserWithServiceAccount(const std::string& username) const;
    LdapUser authenticateAndFindUser(const std::string& username, const std::string& password) const;

private:
    Config config_;
};
