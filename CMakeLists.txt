cmake_minimum_required(VERSION 3.16)
project(job_scheduler)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_subdirectory(vendor/spdlog)
add_subdirectory(vendor/yaml-cpp)

file(COPY config DESTINATION ${CMAKE_BINARY_DIR})

add_executable(scheduler src/main.cpp)

target_include_directories(scheduler PRIVATE include)
target_link_libraries(scheduler PRIVATE spdlog::spdlog)
target_link_libraries(scheduler PRIVATE yaml-cpp)
