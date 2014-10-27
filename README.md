# Groonga Admin

Groonga Admin is a Web UI to administrate Groonga.

Groonga Admin is based on client site technologies such as HTML,
JavaScript and CSS. So you don't need to install server process. You
just publish Groonga Admin by HTTP server provided by Groonga.

## Install

TODO

## For developers

### Install

Install tools:

    % sudo npm install -g -y yo generator-angular grunt-cli bower
    % sudo gem install compass

Clone repository:

    % git clone git@github.com:groonga/groonga-admin.git
    % cd groonga-admin
    % npm install
    % bower install

Run Groonga HTTP server. There are some ways to run Groonga HTTP
server.

  * Use package
  * Run from command line
  * Use Groonga HTTP server run on other host

Use package:

    % sudo apt install -y groonga-server-http

Run from command line:

    % groonga --protocol http -s /path/to/database

Use Groonga HTTP server run on other host: Do nothing. You have a work
on running Groonga Admin.

Run Groonga Admin:

    % grunt server

If you want to use Groonga HTTP server run on `groonga.example.com`,
run Groonga Admin as by the following command line:

    % GROONGA_HOST=groonga.example.com grunt server
