# Groonga Admin

Groonga Admin is a Web UI to administrate Groonga. Groonga Admin is
designed for light Groonga users. It means that users who doesn't know
Groonga details can use Groonga Admin.

Groonga Admin is based on client site technologies such as HTML,
JavaScript and CSS. So you don't need to install server process. You
just publish Groonga Admin by HTTP server provided by Groonga.

## Install

Download the latest archive from http://packages.groonga.org/source/groonga-admin/ .

Extract the archive. Then you get `groonga-X.Y.Z/` directory and find `groonga-X.Y.Z/html/` directory.

Mount the `html/` directory in your Groonga HTTP server.

For
[groonga-server-http](http://groonga.org/docs/server/package.html#groonga-server-http),
add the following line to your `/etc/groonga/groonga.conf`:

    admin-html-path = /PATH/TO/groonga-admin-X.Y.Z/html

Then restart your groonga-server-http and access to http://localhost:10041/ .

For
[groonga-httpd](http://groonga.org/docs/server/package.html#groonga-httpd),
use the following configuration in your `groonga-httpd.conf`:

    location / {
      root /PATH/TO/groonga-admin-X.Y.Z/html;
      index index.html;
    }

Then restart your groonga-httpd and access to http://localhost:10041/ .

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

    % grunt serve

If you want to use Groonga HTTP server run on `groonga.example.com`,
run Groonga Admin as by the following command line:

    % GROONGA_HOST=groonga.example.com grunt serve
