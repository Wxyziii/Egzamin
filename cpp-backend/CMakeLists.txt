cmake_minimum_required(VERSION 3.16)
project(helpdesk_audit_logging LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(helpdesk-audit-demo
    login.cpp
    AuditLogger.cpp
)
