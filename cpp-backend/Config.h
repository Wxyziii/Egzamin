#pragma once

#include <string>

struct Config {
    std::string ldapUri;
    std::string baseDn;
    std::string bindDn;
    std::string bindPassword;
    std::string userDomain;
    bool startTls = false;

    static Config load();
};
