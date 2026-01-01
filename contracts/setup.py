from setuptools import setup, find_packages

setup(
    name="arduino-trader-contracts",
    version="1.0.0",
    description="gRPC contracts for Arduino Trader microservices",
    author="Arduino Trader",
    packages=find_packages(),
    install_requires=[
        "grpcio>=1.60.0",
        "grpcio-tools>=1.60.0",
        "protobuf>=4.25.0",
    ],
    python_requires=">=3.10",
    zip_safe=False,
)
