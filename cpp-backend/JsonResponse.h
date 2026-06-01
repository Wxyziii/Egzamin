#pragma once

#include <string>

struct RoleResult;

namespace JsonResponse {
std::string escape(const std::string& value);
std::string manualLoginRequired();
std::string adError(const std::string& message);
std::string loginError(const std::string& message);
std::string roleOk(const std::string& status, const RoleResult& result);
void writeJson(const std::string& json);
}
