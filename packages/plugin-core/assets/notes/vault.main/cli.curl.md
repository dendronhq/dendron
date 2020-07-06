# Overview
- command line url reference

# Synopsis
```
curl <url|ip>:[port]
```

# Options

## Request

- -f | --fail: fail silently on server error

- -A | --user-agent <agent string>
    eg: "Mozilla/4.0"

- -c | --cookie-jar <filename>
    - where to keep the cookie jar
    
- -H | --header <header>
    - set custom headers. This option can be invoked multiple times

- -L | --location
    Follow relocation headers

- -: | --location
    Follow 300 redirects

- -X | --request <cmd>
    - what type of request to send

- --referer: where did request come from
    eg: --referer http://curl.haxx.se http://daniel.haxx.se

- --no-sesionid
    No cache
        - G|--get

- --keepalive-time <seconds>
    - how long connection is idle before sending keepalive probe
    - @default: 60s

- -d | --data <data>
    Data to attach to the request
    - send details with application/x-www-form-urlencoded. header

- -data-urlencode <data>
    Encodes data before sending it

- -F | --form <name=content>
    Post request
    - multipart/form-data
        eg.
            -F "name=daniel;type=text/foo"

## Security
- -k | --insecure
    Allows insecure SSL connection

- --crlfile: provide PEM file
    eg: --crlfile mycert.pem https://that.secure.server.com

- -u | --user <user:password>
    - user/password for auth
    - default: auth is basic-auth


## Output

- -# | --progress-bar
    Show progress

- -I | --head
    only fetch headers

- -i | --include
    - include http header in output

- -o | --output <file>
    Write to output

- -s | --silent
    No progress

- -w | --write-out <format> : what to write after successful request
    time_<...>: time in seconds

- -S: show error message if fail

- --trace-ascii: store log of requests

# Cook

```sh
# get
curl http://miigroups.com/forms?name="kevin"&press="OK"
curl http://www.weridserver.com:8000/-> get website using port 8000

# post
# will use content type: application/x-www.form-urlencoded
curl --data "name=kevin" http://www.miigroups.com/form
curl --data-urlencode "name=kevin" http://www.miigroups.com/form
curl --data "param1=value1&param2=value2" https://example.com/resource.cgi
```
