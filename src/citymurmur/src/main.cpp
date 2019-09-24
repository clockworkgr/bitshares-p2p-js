#include <napi.h>
#include "citymurmur.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return citymurmur::Init(env, exports);
}

NODE_API_MODULE(citymurmur, InitAll)