#include "JsonResponse.h"

int main() {
    JsonResponse::writeJson(JsonResponse::manualLoginRequired());
    return 0;
}
