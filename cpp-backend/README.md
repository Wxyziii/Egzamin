# C++ AuditLogger demo

This folder contains the active C++ feature for the exam version: local audit logging for login attempts.

The old LDAP/AD CGI source files are kept as historical work, but they are not built by the active Windows CMake setup. The active build does not require LDAP libraries, Kerberos, Apache, keytabs, or Active Directory.

## Files

- `AuditLogger.h` - function declaration
- `AuditLogger.cpp` - writes password-free audit log lines
- `login.cpp` - small CLI demo that calls the logger
- `CMakeLists.txt` - builds `helpdesk-audit-demo`

## Build

```powershell
cmake -S . -B build
cmake --build build
```

## Run

```powershell
.\build\Debug\helpdesk-audit-demo.exe support1 success support local
.\build\Debug\helpdesk-audit-demo.exe user1 failed none local
```

If your CMake generator creates a single-config build:

```powershell
.\build\helpdesk-audit-demo.exe support1 success support local
```

## Log path

Default local path:

```text
logs/helpdesk-auth.log
```

Production Ubuntu path can be configured with:

```text
HELPDESK_AUTH_LOG=/var/log/helpdesk-auth.log
```

The logger never writes passwords.
