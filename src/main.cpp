#include <atomic>
#include <csignal>
#include <chrono>
#include <thread>
#include <yaml-cpp/yaml.h>
#include <spdlog/spdlog.h>

static std::atomic<bool> running = true;

void handle_signal(int) {
    running = false;
}

int main() {
    std::signal(SIGINT, handle_signal);
    std::signal(SIGTERM, handle_signal);

    YAML::Node cfg = YAML::LoadFile("config/default.yaml");
    std::string log_level = cfg["log_level"].as<std::string>();
    spdlog::set_level(spdlog::level::from_str(log_level));

    spdlog::info("scheduler starting.....");

    while (running) {
        spdlog::info("going to sleep zzzZZZZzzzzZ....");
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }

    spdlog::info("shutdown clean");
}
