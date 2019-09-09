# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

try:
    long_description = open("README.md").read()
except IOError:
    long_description = ""

setup(
    name="Designsafe-CI",
    version="4.6.1",
    description="Designsafe-CI Portal",
    license="MIT",
    author="Texas Advanced Computing Center",
    packages=find_packages(),
    long_description=long_description,
    classifiers=[
        "Programming Language :: Python",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
    ],
    python_requires='>=3.6',
    install_requires=[
        "Django>=2.0"
    ],
)
