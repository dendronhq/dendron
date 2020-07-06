---
id: b8472372-5877-4c9f-9afd-375b56df18fe
updated: '2017-12-24T20:01:28Z'

---

# Overview

dig (domain information groper) is a flexible tool for interrogating DNS name servers. It performs DNS lookups and
displays the answers that are returned from the name server(s) that were queried. Most DNS administrators use dig to
troubleshoot DNS problems because of its flexibility, ease of use and clarity of output. Other lookup tools tend to
have less functionality than dig.

# Synopsis

```sh
dig [@server] [-b address] [-c class] [-f filename] [-k filename] [-m] [-p port#] [-q name] [-t type] [-v] [-x addr] [-y [hmac:]name:key] [-4] [-6] [name] [type] [class] [queryopt...]
```

# Options
- [no]trace:
  - dig will act as the recursive nameserver: it  will make iterative queries to nameservers and follow referrals from the root, showing each step along the way
- [no]short
- [no]recurse
    - default: true
- [no]trace 
    - default: false


# Example

```sh

dig google.com

; <> DiG 9.3.3rc2 <> www.google.com
; (1 server found)
;; global options: printcmd
;; Got answer:
;; ->>HEADER<;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 3, ADDITIONAL: 3
;; QUESTION SECTION:
;www.google.com. IN A
;; ANSWER SECTION:
http://www.google.com/. 43200 IN A 200.99.187.2
;; AUTHORITY SECTION:
http://www.google.com/. 43200 IN NS ns2.google.com.
http://www.google.com/. 43200 IN NS ns3.google.com.
http://www.google.com/. 43200 IN NS ns1.google.com.
;; ADDITIONAL SECTION:
ns1.google.com. 43200 IN A 222.54.11.86
ns2.google.com. 43200 IN A 220.225.37.222
ns3.google.com. 43200 IN A 203.199.147.233
;; Query time: 1 msec
;; SERVER: 222.54.11.86#53(222.54.11.86)
;; WHEN: Wed Nov 18 18:31:12 2009
;; MSG SIZE rcvd: 152

```

### Trace

```sh
dig +trace kevinslin.com

. NS l.root-servers.net
com. NS g.gtld-servers.net
kevinslin.com NS dns5-name-services.com.

```


# Cook

### Specify dns server

dig @8.8.8.8 hostname.com

### Look for name server

dig kevinslin.com NS


# FAQ

### How does dig +trace work
- http://superuser.com/questions/715632/how-does-dig-trace-actually-work
- series of dig +norecurse calls 

