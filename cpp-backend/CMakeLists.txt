cmake_minimum_required(VERSION 3.16)
project(helpdesk_ldap_backend LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_library(LDAP_LIBRARY ldap REQUIRED)
find_library(LBER_LIBRARY lber REQUIRED)

set(COMMON_SOURCES
    Config.cpp
    JsonResponse.cpp
    LdapClient.cpp
    RoleResolver.cpp
)

add_executable(ad-bootstrap main_bootstrap.cpp ${COMMON_SOURCES})
target_link_libraries(ad-bootstrap PRIVATE ${LDAP_LIBRARY} ${LBER_LIBRARY})

add_executable(ad-login main_login.cpp AuditLogger.cpp ${COMMON_SOURCES})
target_link_libraries(ad-login PRIVATE ${LDAP_LIBRARY} ${LBER_LIBRARY})
