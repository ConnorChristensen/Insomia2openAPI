# Insomnia to OpenAPI Converter

A converter from an Insomnia environment to an OpenAPI v3.0.1 specification

This is not a project that fully documents everything. It's not magic. It does, however, give you a really nice template to build off of. It takes care of most of the repetitive tasks.

This project is based off of [swaggymnia](https://github.com/mlabouardy/swaggymnia) which is a project written in go to crease swagger documentation from Insomina.
Last I checked, it had some problems working, and has not been updated since December of 2017.

## Requirements

* [Insomina](https://insomnia.rest/)
* Every route should be labeled in the format of `/route/{variable}/route`
* Every route should have documentation filled out
* The insomnia environment needs to be in the folder. It must be called `insomnia.json`
* There needs to be a `config.json` in the folder
* Do not have a file called `docs.json` in the folder unless you do not care about the contents of that file.

## Configuration

The *config.json* file requires a
* title
* version
* description
* components

The *components* is the structure of the objects being sent or received by the routes
