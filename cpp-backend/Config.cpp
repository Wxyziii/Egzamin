#include "Config.h"

#include <cstdlib>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>

namespace {

std::string trim(const std::string& value) {
    const auto first = value.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    const auto last = value.find_last_not_of(" \t\r\n");
    return value.substr(first, last - first + 1);
}

std::unordered_map<std::string, std::string> readKeyValueFile(const std::string& path) {
    std::unordered_map<std::string, std::string> values;
    std::ifstream file(path);
    if (!file) return values;

    std::string line;
    while (std::getline(file, line)) {
        line = trim(line);
        if (line.empty() || line[0] == '#') continue;
        const auto pos = line.find('=');
        if (pos == std::string::npos) continue;
        values[trim(line.substr(0, pos))] = trim(line.substr(pos + 1));
    }
    return values;
}

std::string envOrFile(const char* envName,
                      const std::unordered_map<std::string, std::string>& fileValues,
                      const std::string& key,
                      const std::string& fallback = "") {
    if (const char* env = std::getenv(envName); env && *env) return env;
    if (auto it = fileValues.find(key); it != fileValues.end()) return it->second;
    return fallback;
}

bool toBool(const std::string& value) {
    return value == "1" || value == "true" || value == "TRUE" || value == "yes";
}

} // namespace

Config Config::load() {
    const char* configPath = std::getenv("HELPDESK_LDAP_CONFIG");
    const std::string path = configPath && *configPath ? configPath : "/etc/helpdesk-ldap.conf";
    const auto fileValues = readKeyValueFile(path);

    Config cfg;
    cfg.ldapUri = envOrFile("HELPDESK_LDAP_URI", fileValues, "LDAP_URI", "ldap://192.168.51.2");
    cfg.baseDn = envOrFile("HELPDESK_BASE_DN", fileValues, "BASE_DN", "DC=eksamen,DC=local");
    cfg.bindDn = envOrFile("HELPDESK_BIND_DN", fileValues, "BIND_DN");
    cfg.bindPassword = envOrFile("HELPDESK_BIND_PASSWORD", fileValues, "BIND_PASSWORD");
    cfg.userDomain = envOrFile("HELPDESK_USER_DOMAIN", fileValues, "USER_DOMAIN", "eksamen.local");
    cfg.startTls = toBool(envOrFile("HELPDESK_START_TLS", fileValues, "START_TLS", "false"));

    if (cfg.bindDn.empty() || cfg.bindPassword.empty()) {
        throw std::runtime_error("LDAP service account is not configured");
    }
    return cfg;
}
