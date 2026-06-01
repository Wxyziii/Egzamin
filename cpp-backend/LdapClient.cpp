#include "LdapClient.h"

#include <ldap.h>

#include <memory>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {

struct LdapHandle {
    LDAP* ptr = nullptr;
    LdapHandle() = default;
    LdapHandle(const LdapHandle&) = delete;
    LdapHandle& operator=(const LdapHandle&) = delete;
    LdapHandle(LdapHandle&& other) noexcept : ptr(other.ptr) {
        other.ptr = nullptr;
    }
    LdapHandle& operator=(LdapHandle&& other) noexcept {
        if (this != &other) {
            if (ptr) ldap_unbind_ext_s(ptr, nullptr, nullptr);
            ptr = other.ptr;
            other.ptr = nullptr;
        }
        return *this;
    }
    ~LdapHandle() {
        if (ptr) ldap_unbind_ext_s(ptr, nullptr, nullptr);
    }
};

void check(int rc, const std::string& context) {
    if (rc != LDAP_SUCCESS) {
        throw std::runtime_error(context + ": " + ldap_err2string(rc));
    }
}

std::string escapeFilterValue(const std::string& value) {
    std::string escaped;
    for (unsigned char ch : value) {
        switch (ch) {
            case '*': escaped += "\\2a"; break;
            case '(': escaped += "\\28"; break;
            case ')': escaped += "\\29"; break;
            case '\\': escaped += "\\5c"; break;
            case '\0': escaped += "\\00"; break;
            default: escaped += static_cast<char>(ch); break;
        }
    }
    return escaped;
}

LdapHandle connectLdap(const Config& config) {
    LdapHandle handle;
    check(ldap_initialize(&handle.ptr, config.ldapUri.c_str()), "ldap_initialize");

    int version = LDAP_VERSION3;
    check(ldap_set_option(handle.ptr, LDAP_OPT_PROTOCOL_VERSION, &version), "ldap_set_option LDAPv3");

    if (config.startTls) {
        check(ldap_start_tls_s(handle.ptr, nullptr, nullptr), "ldap_start_tls_s");
    }

    return handle;
}

void bindSimple(LDAP* ldap, const std::string& dn, const std::string& password, const std::string& context) {
    berval cred{};
    cred.bv_val = const_cast<char*>(password.c_str());
    cred.bv_len = password.size();
    check(ldap_sasl_bind_s(ldap, dn.c_str(), LDAP_SASL_SIMPLE, &cred, nullptr, nullptr, nullptr), context);
}

LdapUser searchUser(LDAP* ldap, const Config& config, const std::string& username) {
    const std::string filter = "(&(objectClass=user)(sAMAccountName=" + escapeFilterValue(username) + "))";
    char* attrs[] = {const_cast<char*>("memberOf"), const_cast<char*>("sAMAccountName"), nullptr};
    LDAPMessage* rawResult = nullptr;

    const int rc = ldap_search_ext_s(
        ldap,
        config.baseDn.c_str(),
        LDAP_SCOPE_SUBTREE,
        filter.c_str(),
        attrs,
        0,
        nullptr,
        nullptr,
        nullptr,
        1,
        &rawResult
    );
    std::unique_ptr<LDAPMessage, decltype(&ldap_msgfree)> result(rawResult, ldap_msgfree);
    check(rc, "ldap_search_ext_s user lookup");

    LDAPMessage* entry = ldap_first_entry(ldap, result.get());
    if (!entry) {
        throw std::runtime_error("User not found in Active Directory");
    }

    char* rawDn = ldap_get_dn(ldap, entry);
    if (!rawDn) {
        throw std::runtime_error("Could not read user DN");
    }
    std::unique_ptr<char, decltype(&ldap_memfree)> dn(rawDn, ldap_memfree);

    LdapUser user;
    user.username = username;
    user.dn = dn.get();

    // Active Directory returns group membership through memberOf DNs.
    berval** values = ldap_get_values_len(ldap, entry, "memberOf");
    if (values) {
        for (int i = 0; values[i] != nullptr; ++i) {
            user.memberOf.emplace_back(values[i]->bv_val, values[i]->bv_len);
        }
        ldap_value_free_len(values);
    }

    return user;
}

} // namespace

LdapClient::LdapClient(Config config) : config_(std::move(config)) {}

LdapUser LdapClient::findUserWithServiceAccount(const std::string& username) const {
    auto ldap = connectLdap(config_);
    bindSimple(ldap.ptr, config_.bindDn, config_.bindPassword, "LDAP service bind");
    return searchUser(ldap.ptr, config_, username);
}

LdapUser LdapClient::authenticateAndFindUser(const std::string& username, const std::string& password) const {
    if (password.empty()) {
        throw std::runtime_error("Password is required");
    }

    auto serviceLdap = connectLdap(config_);
    bindSimple(serviceLdap.ptr, config_.bindDn, config_.bindPassword, "LDAP service bind");
    LdapUser user = searchUser(serviceLdap.ptr, config_, username);

    // Manual login validates the real AD password by binding as the found user DN.
    auto userLdap = connectLdap(config_);
    bindSimple(userLdap.ptr, user.dn, password, "LDAP user bind");

    // Group membership is still read from AD and resolved server-side.
    return user;
}
