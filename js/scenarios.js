const SCENARIOS = {
  ddos: {
    label: 'DDoS Volumétrico',
    check: 'ddos',
    status: { cpu: 18, mem: 44, load: '0.42 0.38 0.31', srv: '<span class="yellow">degradado</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue"> 712</span> <span class="dim">kernel</span> <span class="red">  2%</span> <span class="dim">0.1%</span> <span class="red">ksoftirqd/0 (net rx flood)</span></span>',
    nload: '<span class="t-line"><span class="red bold">In:  ████████████████████████ 38.4 Gbps  [!!! SATURADO]</span></span><span class="t-line"><span class="green">Out: ██ 124 Mbps  (normal)</span></span>',
    iftop: '<span class="t-line"><span class="red">185.234.48.x  →  10.0.0.1   UDP   8.2 Gbps</span></span><span class="t-line"><span class="red">91.108.14.x   →  10.0.0.1   UDP   6.7 Gbps</span></span><span class="t-line"><span class="red">45.33.x.x     →  10.0.0.1   UDP   5.1 Gbps</span></span><span class="t-line"><span class="dim">192.168.1.5   →  10.0.0.1   TCP   2 Mbps</span></span>',
    nethogs: '<span class="t-line"><span class="dim">PID 1842  nginx              48 Mbps in  (recebendo menos q o uplink)</span></span><span class="t-line"><span class="red">kernel/NIC   recebendo 38.4Gbps — dropping packets antes do app</span></span>',
    ss: '<span class="t-line"><span class="dim">Total: 1842</span>  <span class="red">TCP: 38 SYN-RECV  TIME-WAIT: 791</span></span><span class="t-line"><span class="yellow">UDP: 987 (muito acima do normal)</span></span>',
    netstat: '<span class="t-line"><span class="red">udp   0.0.0.0:*   185.234.48.22:41221   —</span></span><span class="t-line"><span class="red">udp   0.0.0.0:*   91.108.14.55:38871    —</span></span><span class="t-line"><span class="red">udp   0.0.0.0:*   45.33.12.8:51993      —</span></span><span class="t-line"><span class="dim">tcp   192.168.1.5:44801  ESTABLISHED</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="red">185.234.48.22 → 10.0.0.1  UDP  len=1472</span></span><span class="t-line"><span class="dim">12:41:22.115</span>  <span class="red">91.108.14.55  → 10.0.0.1  UDP  len=1472</span></span><span class="t-line"><span class="dim">12:41:22.115</span>  <span class="red">45.33.12.8    → 10.0.0.1  UDP  len=1472</span></span><span class="t-line"><span class="dim">12:41:22.116</span>  <span class="red">77.94.3.201   → 10.0.0.1  UDP  len=1472</span></span><span class="t-line"><span class="green">12:41:22.201</span>  <span class="green">192.168.1.5   → 10.0.0.1  TCP  len=128</span></span>',
    nginx_log: '<span class="t-line"><span class="yellow">poucos acessos — banda consumida antes de chegar ao app</span></span><span class="t-line"><span class="dim">192.168.1.5 - GET / HTTP/1.1 200 — normal</span></span>',
    auth_log: '<span class="t-line"><span class="green">sem tentativas de login suspeitas. normal.</span></span>',
    syslog: '<span class="t-line"><span class="red">kernel: nf_conntrack: table full, dropping packet</span></span><span class="t-line"><span class="red">kernel: UDP: bad checksum. From 185.234.48.22</span></span>',
    dmesg: '<span class="t-line"><span class="red">[ 8421.2] nf_conntrack: table full, dropping packet</span></span><span class="t-line"><span class="red">[ 8421.9] UDP: bad checksum. From 185.234.48.22</span></span><span class="t-line"><span class="yellow">[ 8422.1] net_ratelimit: 847 callbacks suppressed</span></span>',
    whois_ip: '185.234.48.22',
    whois_result: '<span class="t-line"><span class="dim">OrgName:  BulkVPN Ltd</span></span><span class="t-line"><span class="dim">Country:  RU</span></span><span class="t-line"><span class="dim">NetRange: 185.234.48.0/22</span></span><span class="t-line"><span class="dim">ASN:      AS209854</span></span>',
    geoip_result: '<span class="t-line"><span class="blue">185.234.48.22</span> <span class="dim">→</span> <span class="red">RU</span> <span class="dim">Moscou / BulkVPN Ltd / AS209854</span></span>',
    abuse_result: '<span class="t-line"><span class="red">Score: 97/100</span>  <span class="dim">| 847 reports | DDoS, botnet, spam</span></span>',
    iostat: '<span class="t-line"><span class="green">disk I/O: %util 4% — problema é exclusivamente de rede, não disco</span></span>',
    vmstat: '<span class="t-line"><span class="red">in: 8421  so: 0</span>  <span class="dim">— alto número de interrupções de rede (NIC overwhelmed)</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain INPUT: nenhuma regra de bloqueio ativa — tudo passando</span></span>',
    hints: [
      'O tráfego de entrada está muito acima do normal. Use nload.',
      'Observe o protocolo dominante no tcpdump — é TCP ou UDP?',
      'Múltiplos IPs de países diferentes, mesmo protocolo, mesmo destino.',
      'CPU está baixa mas o servidor está degradado — onde está o gargalo?'
    ],
    score_cmds: ['top', 'nload', 'iftop', 'tcpdump', 'netstat', 'ss', 'whois', 'geoip', 'abuse', 'dmesg']
  },

  syn: {
    label: 'SYN Flood',
    check: 'syn',
    status: { cpu: 62, mem: 48, load: '4.21 3.88 2.91', srv: '<span class="red">degradado</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue">   1</span> <span class="dim">kernel</span> <span class="red"> 58%</span> <span class="dim">0.1%</span> <span class="red">ksoftirqd/0 (SYN-ACK flood)</span></span>',
    nload: '<span class="t-line"><span class="yellow">In:  ████████ 6.1 Gbps</span></span><span class="t-line"><span class="green">Out: ████ 4.8 Gbps (SYN-ACK responses)</span></span>',
    iftop: '<span class="t-line"><span class="red">forged IPs  →  10.0.0.1:80   TCP/SYN  3.2 Gbps</span></span><span class="t-line"><span class="red">forged IPs  →  10.0.0.1:443  TCP/SYN  2.9 Gbps</span></span>',
    nethogs: '<span class="t-line"><span class="dim">PID  981  sshd        2 Mbps</span></span><span class="t-line"><span class="red">kernel SYN-ACK generator — 4.8 Gbps out (respondendo SYNs)</span></span>',
    ss: '<span class="t-line"><span class="red">SYN-RECV: 65421  (!! tabela CHEIA — limite: 65536)</span></span><span class="t-line"><span class="dim">ESTABLISHED: 14  TIME-WAIT: 32</span></span>',
    netstat: '<span class="t-line"><span class="red">tcp  SYN_RECV  0.0.0.0:80  104.21.x.x:random  (×65k entradas)</span></span><span class="t-line"><span class="dim">tcp  ESTABLISHED  192.168.1.5:44801  10.0.0.1:80</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="red">104.21.82.x  → 10.0.0.1:80  TCP [SYN]  seq=rand  IP FORJADO</span></span><span class="t-line"><span class="dim">12:41:22.115</span>  <span class="red">172.64.x.x   → 10.0.0.1:80  TCP [SYN]  seq=rand  IP FORJADO</span></span><span class="t-line"><span class="dim">12:41:22.116</span>  <span class="red">198.41.x.x   → 10.0.0.1:80  TCP [SYN]  seq=rand  IP FORJADO</span></span><span class="t-line"><span class="yellow">12:41:22.201</span>  <span class="yellow">10.0.0.1 → 104.21.82.x  TCP [SYN,ACK]  (sem ACK de volta)</span></span>',
    nginx_log: '<span class="t-line"><span class="yellow">poucos acessos — conexões nunca completam o handshake TCP</span></span>',
    auth_log: '<span class="t-line"><span class="green">normal.</span></span>',
    syslog: '<span class="t-line"><span class="red">kernel: TCP: request_sock_TCP: Possible SYN flooding on port 80.</span></span><span class="t-line"><span class="yellow">kernel: Sending cookies. Check SNMP counters.</span></span>',
    dmesg: '<span class="t-line"><span class="red">[ 8211.4] TCP: request_sock_TCP: Possible SYN flooding on port 80.</span></span><span class="t-line"><span class="red">[ 8211.4] Sending cookies. Check SNMP counters.</span></span><span class="t-line"><span class="yellow">[ 8212.1] TCP: SYN backlog overflow detected</span></span>',
    whois_ip: '104.21.82.43',
    whois_result: '<span class="t-line"><span class="yellow">OrgName: Cloudflare — ATENÇÃO: IP FORJADO (IP spoofing)</span></span><span class="t-line"><span class="dim">Os IPs de origem são falsificados. O atacante real está oculto.</span></span>',
    geoip_result: '<span class="t-line"><span class="yellow">IPs forjados — geolocalização não confiável. Múltiplos países.</span></span>',
    abuse_result: '<span class="t-line"><span class="yellow">IP Cloudflare — score não aplicável (IP forjado/spoofed)</span></span>',
    iostat: '<span class="t-line"><span class="green">I/O de disco normal.</span></span>',
    vmstat: '<span class="t-line"><span class="red">in: 18421  cs: 92441</span>  <span class="dim">— altíssimo context-switch por SYN-ACK responses</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain INPUT: nenhuma regra de bloqueio — SYN packets passando livremente</span></span>',
    hints: [
      'Veja o estado das conexões TCP com ss -s.',
      'Há muitas conexões no estado SYN_RECV?',
      'O dmesg menciona algo sobre SYN flooding?',
      'O tcpdump mostra handshake TCP completo (SYN → SYN-ACK → ACK)?'
    ],
    score_cmds: ['ss', 'netstat', 'tcpdump', 'dmesg', 'top', 'nload', 'vmstat']
  },

  http: {
    label: 'HTTP Flood (Layer 7)',
    check: 'http',
    status: { cpu: 94, mem: 71, load: '7.82 6.41 4.12', srv: '<span class="red">crítico — 503s</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue"> 2841</span> <span class="dim">www</span> <span class="red"> 94%</span> <span class="dim">12.4%</span> <span class="red">php-fpm: pool www (workers esgotados)</span></span>',
    nload: '<span class="t-line"><span class="yellow">In:  ████ 2.3 Gbps  (volume moderado)</span></span><span class="t-line"><span class="green">Out: ███ 1.8 Gbps</span></span>',
    iftop: '<span class="t-line"><span class="red">84.21.x.x   →  10.0.0.1:80  TCP  480 Mbps</span></span><span class="t-line"><span class="red">195.x.x.x   →  10.0.0.1:80  TCP  410 Mbps</span></span><span class="t-line"><span class="red">103.x.x.x   →  10.0.0.1:80  TCP  380 Mbps</span></span>',
    nethogs: '<span class="t-line"><span class="red">PID 2841  php-fpm   2.1 Gbps in  1.8 Gbps out  94% CPU</span></span>',
    ss: '<span class="t-line"><span class="yellow">ESTABLISHED: 8421  (HTTP connections — muito alto)</span></span><span class="t-line"><span class="dim">TIME-WAIT: 12441</span></span>',
    netstat: '<span class="t-line"><span class="red">tcp ESTABLISHED 84.21.22.x:random → 10.0.0.1:80  (×84 hosts)</span></span><span class="t-line"><span class="red">tcp ESTABLISHED 195.12.x.x:random → 10.0.0.1:80  (×51 hosts)</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="red">84.21.22.4  → 10.0.0.1:80  HTTP GET /search?q=aaaa  len=512</span></span><span class="t-line"><span class="dim">12:41:22.115</span>  <span class="red">195.12.3.8  → 10.0.0.1:80  HTTP GET /products?id=9  len=488</span></span><span class="t-line"><span class="dim">12:41:22.116</span>  <span class="red">103.4.5.6   → 10.0.0.1:80  HTTP GET /search?q=bbbb  len=501</span></span>',
    nginx_log: '<span class="t-line"><span class="red">84.21.22.4  - GET /search?q=aaaa HTTP/1.1 200 — Mozilla/5.0</span></span><span class="t-line"><span class="red">195.12.3.8  - GET /products?id=9 HTTP/1.1 503 — Mozilla/5.0</span></span><span class="t-line"><span class="red">103.4.5.6   - GET /search?q=bbbb HTTP/1.1 503 — Mozilla/5.0</span></span><span class="t-line"><span class="yellow">[!] 14.200 req/s — padrão anômalo: User-Agents idênticos, endpoints repetidos</span></span>',
    auth_log: '<span class="t-line"><span class="green">normal.</span></span>',
    syslog: '<span class="t-line"><span class="dim">php-fpm: max_children reached — rejecting connections</span></span><span class="t-line"><span class="yellow">nginx: upstream timed out (110: Connection timed out)</span></span>',
    dmesg: '<span class="t-line"><span class="dim">nada anômalo no kernel. problema é na camada de aplicação (L7).</span></span>',
    whois_ip: '84.21.22.4',
    whois_result: '<span class="t-line"><span class="dim">OrgName: DigitalOcean LLC</span></span><span class="t-line"><span class="dim">Country: SG</span></span><span class="t-line"><span class="dim">NetRange: 84.21.0.0/16</span></span>',
    geoip_result: '<span class="t-line"><span class="blue">84.21.22.4</span> <span class="dim">→</span> <span class="red">SG</span> <span class="dim">Singapura / DigitalOcean / AS14061</span></span>',
    abuse_result: '<span class="t-line"><span class="red">Score: 88/100</span>  <span class="dim">| 341 reports | HTTP flood, botnet layer-7</span></span>',
    iostat: '<span class="t-line"><span class="red">%util: 78% — banco de dados sobrecarregado por queries repetitivas</span></span>',
    vmstat: '<span class="t-line"><span class="yellow">us: 92  sy: 6</span>  <span class="dim">— CPU consumida por userspace (PHP/app)</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain INPUT: sem bloqueio. Requisições HTTP chegando normalmente.</span></span>',
    hints: [
      'CPU está muito alta. Qual processo está consumindo?',
      'O volume de rede não é tão alto — mas o servidor está falhando.',
      'Veja os logs do nginx — o padrão de requisições é normal?',
      'Os User-Agents são todos iguais? Quantos requests por segundo?'
    ],
    score_cmds: ['top', 'nginx', 'iftop', 'tcpdump', 'iostat', 'vmstat', 'whois', 'abuse']
  },

  amp: {
    label: 'Amplificação DNS',
    check: 'amp',
    status: { cpu: 22, mem: 41, load: '0.88 0.72 0.51', srv: '<span class="red">inacessível — banda saturada</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="dim">CPU e sistema relativamente tranquilos — gargalo é banda de rede</span></span>',
    nload: '<span class="t-line"><span class="red bold">In:  ████████████████████████████ 52.7 Gbps  [!!! CRÍTICO]</span></span><span class="t-line"><span class="green">Out: █ 48 Mbps  (mínimo)</span></span>',
    iftop: '<span class="t-line"><span class="red">8.8.8.x  (DNS) →  10.0.0.1  UDP/53  12.4 Gbps</span></span><span class="t-line"><span class="red">1.1.1.x  (DNS) →  10.0.0.1  UDP/53   9.8 Gbps</span></span><span class="t-line"><span class="red">9.9.9.x  (DNS) →  10.0.0.1  UDP/53   8.2 Gbps</span></span>',
    nethogs: '<span class="t-line"><span class="dim">kernel/NIC recebendo 52.7Gbps de respostas DNS — sem processo específico</span></span>',
    ss: '<span class="t-line"><span class="red">UDP porta 53: 3841 (todo tráfego vindo de DNS)</span></span><span class="t-line"><span class="dim">TCP: 22 (mínimo, normal)</span></span>',
    netstat: '<span class="t-line"><span class="red">udp  8.8.8.8:53   → 10.0.0.1  (DNS Response — REFLETOR)</span></span><span class="t-line"><span class="red">udp  1.1.1.1:53   → 10.0.0.1  (DNS Response — REFLETOR)</span></span><span class="t-line"><span class="red">udp  9.9.9.9:53   → 10.0.0.1  (DNS Response — REFLETOR)</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="red">8.8.8.8:53  → 10.0.0.1  UDP  DNS Response  len=3218</span></span><span class="t-line"><span class="dim">12:41:22.115</span>  <span class="red">1.1.1.1:53  → 10.0.0.1  UDP  DNS Response  len=3102</span></span><span class="t-line"><span class="dim">12:41:22.116</span>  <span class="red">9.9.9.9:53  → 10.0.0.1  UDP  DNS Response  len=3441</span></span><span class="t-line"><span class="yellow">! tráfego vem de DNS legítimos — atacante forjou nosso IP nas queries</span></span>',
    nginx_log: '<span class="t-line"><span class="dim">sem acessos — banda esgotada antes de chegar ao HTTP</span></span>',
    auth_log: '<span class="t-line"><span class="green">normal.</span></span>',
    syslog: '<span class="t-line"><span class="red">kernel: UDP: bad checksum. From 8.8.8.8 port 53</span></span><span class="t-line"><span class="red">kernel: nf_conntrack: table full, dropping packet</span></span>',
    dmesg: '<span class="t-line"><span class="red">[ 7821.1] UDP: bad checksum. From 8.8.8.8 port 53</span></span><span class="t-line"><span class="red">[ 7821.4] nf_conntrack: table full, dropping packet</span></span>',
    whois_ip: '8.8.8.8',
    whois_result: '<span class="t-line"><span class="yellow">OrgName: Google LLC — ESTE É UM REFLETOR, não o atacante real</span></span><span class="t-line"><span class="dim">O atacante forjou nosso IP → DNS responde para nós (amplificação 70x)</span></span>',
    geoip_result: '<span class="t-line"><span class="yellow">8.8.8.8 = Google DNS público — usado como amplificador/refletor</span></span><span class="t-line"><span class="dim">O atacante real está oculto. IPs de DNS são legítimos mas explorados.</span></span>',
    abuse_result: '<span class="t-line"><span class="yellow">Google DNS — não é o atacante. É refletor explorado por amplificação.</span></span>',
    iostat: '<span class="t-line"><span class="green">I/O normal. Problema é exclusivamente de banda de rede.</span></span>',
    vmstat: '<span class="t-line"><span class="yellow">in: 12841</span>  <span class="dim">— alto número de interrupções de rede (UDP flood)</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain INPUT: sem bloqueio de porta 53 UDP. Respostas DNS chegando.</span></span>',
    hints: [
      'De onde vem o tráfego? Qual porta e protocolo?',
      'Por que servidores DNS do Google/Cloudflare estariam te atacando?',
      'Olhe o tamanho dos pacotes no tcpdump — compare query vs response DNS.',
      'A saída de banda está proporcional à entrada?'
    ],
    score_cmds: ['nload', 'iftop', 'tcpdump', 'netstat', 'ss', 'dmesg', 'whois']
  },

  slowloris: {
    label: 'Slowloris',
    check: 'slowloris',
    status: { cpu: 31, mem: 52, load: '1.22 1.18 0.94', srv: '<span class="red">inacessível — slots cheios</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue"> 1842</span> <span class="dim">www</span> <span class="yellow"> 31%</span> <span class="dim">8.2%</span> <span class="yellow">apache2 (worker slots cheios — connections queued)</span></span>',
    nload: '<span class="t-line"><span class="dim">In:  ██ 48 Mbps  (tráfego BAIXO — enganoso!)</span></span><span class="t-line"><span class="dim">Out: █  12 Mbps</span></span>',
    iftop: '<span class="t-line"><span class="yellow">104.21.x.x   → 10.0.0.1:80   TCP  8.2 Mbps  (poucos hosts)</span></span><span class="t-line"><span class="dim">outros — mínimo</span></span>',
    nethogs: '<span class="t-line"><span class="dim">PID 1842  apache2   8.2 Mbps in  12 Mbps out</span></span><span class="t-line"><span class="yellow">apesar da baixa banda — 1021 conexões abertas simultâneas</span></span>',
    ss: '<span class="t-line"><span class="red">ESTABLISHED: 1021  (!! limite Apache: MaxClients=1024)</span></span><span class="t-line"><span class="yellow">CLOSE-WAIT: 847  TIME-WAIT: 0</span></span>',
    netstat: '<span class="t-line"><span class="red">tcp ESTABLISHED 104.21.82.4:random → 10.0.0.1:80  (×1021)</span></span><span class="t-line"><span class="dim">todas as conexões do mesmo IP ou bloco</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="yellow">104.21.82.4 → 10.0.0.1:80  GET / HTTP/1.1\\r\\nHost: ...</span></span><span class="t-line"><span class="dim">12:41:28.821</span>  <span class="yellow">104.21.82.4 → 10.0.0.1:80  X-Custom: aaa  (header parcial)</span></span><span class="t-line"><span class="dim">12:41:45.003</span>  <span class="yellow">104.21.82.4 → 10.0.0.1:80  X-Custom: bbb  (mantendo viva)</span></span><span class="t-line"><span class="dim">12:41:58.441</span>  <span class="yellow">104.21.82.4 → 10.0.0.1:80  X-Custom: ccc  (nunca finaliza)</span></span>',
    nginx_log: '<span class="t-line"><span class="yellow">104.21.82.4 — conexões abertas, sem requisições HTTP completas</span></span><span class="t-line"><span class="dim">timeout de headers: nunca expiram (keepalive infinito)</span></span>',
    auth_log: '<span class="t-line"><span class="green">normal.</span></span>',
    syslog: '<span class="t-line"><span class="yellow">apache2: MaxClients reached — not accepting any new connections</span></span>',
    dmesg: '<span class="t-line"><span class="dim">nada anômalo no kernel. ataque é puramente na camada de aplicação (L7).</span></span>',
    whois_ip: '104.21.82.4',
    whois_result: '<span class="t-line"><span class="dim">OrgName: Cloudflare / Attacker proxy</span></span><span class="t-line"><span class="dim">Country: US</span></span>',
    geoip_result: '<span class="t-line"><span class="blue">104.21.82.4</span> <span class="dim">→</span> <span class="yellow">US</span> <span class="dim">San Francisco / proxy node / AS13335</span></span>',
    abuse_result: '<span class="t-line"><span class="red">Score: 91/100</span>  <span class="dim">| 218 reports | slowloris, HTTP attack</span></span>',
    iostat: '<span class="t-line"><span class="green">I/O normal.</span></span>',
    vmstat: '<span class="t-line"><span class="dim">normal. ataque consome slots de conexão, não CPU/memória significativa.</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain INPUT: sem bloqueio. Conexões TCP legítimas passando.</span></span>',
    hints: [
      'O tráfego de rede está baixo — mas o servidor está inacessível.',
      'Quantas conexões TCP abertas existem? De quantos IPs?',
      'Veja o que o tcpdump mostra sobre o conteúdo dos pacotes HTTP.',
      'CPU está moderada — onde está o gargalo então?'
    ],
    score_cmds: ['ss', 'netstat', 'tcpdump', 'iftop', 'nload', 'nginx_log', 'whois', 'abuse']
  },

  brute: {
    label: 'Brute Force SSH',
    check: 'brute',
    status: { cpu: 8, mem: 38, load: '0.18 0.21 0.19', srv: '<span class="green">online</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue"> 981</span> <span class="dim">root</span> <span class="yellow">  8%</span> <span class="dim">0.4%</span> <span class="yellow">sshd: auth attempt</span></span>',
    nload: '<span class="t-line"><span class="dim">In:  █ 82 Mbps  (normal)</span></span><span class="t-line"><span class="dim">Out: █ 74 Mbps  (normal)</span></span>',
    iftop: '<span class="t-line"><span class="yellow">185.234.x.x  → 10.0.0.1:22  TCP  12 Mbps</span></span><span class="t-line"><span class="dim">192.168.1.x  → 10.0.0.1:80  TCP   2 Mbps  (normal)</span></span>',
    nethogs: '<span class="t-line"><span class="yellow">PID 981  sshd   12 Mbps in  8 Mbps out  (anormalmente alto para SSH)</span></span>',
    ss: '<span class="t-line"><span class="dim">ESTABLISHED: 28  (normal)</span></span><span class="t-line"><span class="yellow">TCP porta 22: 41 conexões ativas  (suspeito)</span></span>',
    netstat: '<span class="t-line"><span class="yellow">tcp ESTABLISHED 185.234.x.x:random → 10.0.0.1:22  (×41)</span></span><span class="t-line"><span class="dim">tcp ESTABLISHED 192.168.1.5:44801 → 10.0.0.1:80</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="yellow">185.234.48.22 → 10.0.0.1:22  TCP SSH handshake</span></span><span class="t-line"><span class="dim">12:41:22.312</span>  <span class="yellow">185.234.48.22 → 10.0.0.1:22  TCP SSH auth attempt</span></span><span class="t-line"><span class="dim">12:41:22.488</span>  <span class="yellow">185.234.48.22 → 10.0.0.1:22  TCP SSH auth attempt</span></span><span class="t-line"><span class="dim">12:41:22.621</span>  <span class="yellow">185.234.48.22 → 10.0.0.1:22  TCP SSH auth attempt</span></span>',
    nginx_log: '<span class="t-line"><span class="green">normal. sem anomalias HTTP.</span></span>',
    auth_log: '<span class="t-line"><span class="red">Failed password for root from 185.234.48.22 port 41221 ssh2</span></span><span class="t-line"><span class="red">Failed password for admin from 185.234.48.22 port 41222 ssh2</span></span><span class="t-line"><span class="red">Failed password for ubuntu from 185.234.48.22 port 41223 ssh2</span></span><span class="t-line"><span class="red">Invalid user pi from 185.234.48.22 port 41224</span></span><span class="t-line"><span class="red bold">[!] 847 tentativas em 120 segundos do mesmo IP</span></span>',
    syslog: '<span class="t-line"><span class="yellow">sshd: PAM 5 more authentication failures; logname= uid=0</span></span>',
    dmesg: '<span class="t-line"><span class="dim">nada anômalo no kernel.</span></span>',
    whois_ip: '185.234.48.22',
    whois_result: '<span class="t-line"><span class="dim">OrgName: BulkVPN Ltd / anonymous VPN</span></span><span class="t-line"><span class="dim">Country: RU</span></span>',
    geoip_result: '<span class="t-line"><span class="blue">185.234.48.22</span> <span class="dim">→</span> <span class="red">RU</span> <span class="dim">Moscou / BulkVPN / AS209854</span></span>',
    abuse_result: '<span class="t-line"><span class="red">Score: 99/100</span>  <span class="dim">| 4821 reports | SSH brute force, credential stuffing</span></span>',
    iostat: '<span class="t-line"><span class="green">normal.</span></span>',
    vmstat: '<span class="t-line"><span class="dim">normal.</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain INPUT: porta 22 aberta para 0.0.0.0/0 — sem restrição de origem</span></span>',
    hints: [
      'O servidor HTTP parece ok. Onde está a anomalia?',
      'Alguma porta específica com muita atividade suspeita?',
      'Veja o auth.log com cuidado — o que está acontecendo lá?',
      'CPU baixa, rede normal — mas algo está errado...'
    ],
    score_cmds: ['auth', 'netstat', 'tcpdump', 'whois', 'geoip', 'abuse', 'iftop']
  },

  cryptominer: {
    label: 'Cryptominer Instalado',
    check: 'cryptominer',
    status: { cpu: 97, mem: 82, load: '15.2 14.8 13.1', srv: '<span class="yellow">lento</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue"> 9871</span> <span class="dim">nobody</span> <span class="red"> 97%</span> <span class="dim">14.2%</span> <span class="red">xmrig --pool pool.xmr.pt:3333 --donate-level 0</span></span>',
    nload: '<span class="t-line"><span class="dim">In:  █ 18 Mbps  (normal)</span></span><span class="t-line"><span class="yellow bold">Out: ███ 480 Mbps  (ALTO — enviando shares de mineração)</span></span>',
    iftop: '<span class="t-line"><span class="red">10.0.0.1  → pool.xmr.pt:3333   TCP  480 Mbps  (saída)</span></span><span class="t-line"><span class="dim">192.168.1.5  → 10.0.0.1:80  TCP  2 Mbps  (normal)</span></span>',
    nethogs: '<span class="t-line"><span class="red">PID 9871  xmrig   480 Mbps out  12 Mbps in  97% CPU</span></span><span class="t-line"><span class="dim">PID 1842  nginx     2 Mbps</span></span>',
    ss: '<span class="t-line"><span class="dim">ESTABLISHED: 28  (normal)</span></span><span class="t-line"><span class="yellow">TCP porta 3333: 3 conexões ativas para mining pool</span></span>',
    netstat: '<span class="t-line"><span class="red">tcp ESTABLISHED 10.0.0.1:random → 45.32.x.x:3333  (mining pool)</span></span><span class="t-line"><span class="dim">tcp ESTABLISHED 192.168.1.5:44801 → 10.0.0.1:80</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="red">10.0.0.1 → 45.32.14.8:3333  TCP stratum mining protocol</span></span><span class="t-line"><span class="dim">12:41:22.841</span>  <span class="red">45.32.14.8:3333 → 10.0.0.1  TCP job assignment</span></span><span class="t-line"><span class="dim">12:41:23.102</span>  <span class="red">10.0.0.1 → 45.32.14.8:3333  TCP share submission</span></span>',
    nginx_log: '<span class="t-line"><span class="dim">normal. poucos acessos — servidor lento por falta de CPU.</span></span>',
    auth_log: '<span class="t-line"><span class="yellow">Accepted publickey for root from 185.234.48.22 port 41220 ssh2</span></span><span class="t-line"><span class="red">[login suspeito 4 dias atrás, 03:47 — fora do horário normal]</span></span><span class="t-line"><span class="dim">após o login: histórico de comandos limpo</span></span>',
    syslog: '<span class="t-line"><span class="dim">cron: (root) CMD (xmrig --pool pool.xmr.pt:3333 -t 4)</span></span>',
    dmesg: '<span class="t-line"><span class="dim">nada anômalo no kernel. o miner é userspace.</span></span>',
    whois_ip: '45.32.14.8',
    whois_result: '<span class="t-line"><span class="dim">OrgName: Vultr Holdings LLC</span></span><span class="t-line"><span class="red">Porta 3333 — Monero mining pool (pool.xmr.pt)</span></span>',
    geoip_result: '<span class="t-line"><span class="blue">45.32.14.8</span> <span class="dim">→</span> <span class="red">NL</span> <span class="dim">Amsterdam / Vultr / AS20473 — mining pool XMR</span></span>',
    abuse_result: '<span class="t-line"><span class="red">Score: 84/100</span>  <span class="dim">| known cryptomining infrastructure (Monero)</span></span>',
    iostat: '<span class="t-line"><span class="yellow">%util: 41% — carga moderada de I/O (hashing intensivo)</span></span>',
    vmstat: '<span class="t-line"><span class="red">us: 97  sy: 2</span>  <span class="dim">— quase todo CPU em userspace (processo de mineração)</span></span>',
    iptables: '<span class="t-line"><span class="dim">Chain OUTPUT: porta 3333 liberada. Conexão saindo sem restrição.</span></span>',
    crontab_extra: '<span class="red">* * * * *   root   /tmp/.xmr/xmrig --pool pool.xmr.pt:3333 --donate-level 0 -t 4 >/dev/null 2>&1</span>',
    hints: [
      'CPU está absurdamente alta. Qual processo está consumindo?',
      'O tráfego de saída está mais alto que o de entrada — incomum.',
      'Verifique conexões de saída com iftop ou netstat.',
      'Quem fez login no servidor recentemente? Veja o auth.log.',
      'Verifique se há processos suspeitos com ps aux — veja o path completo.',
      'Confira o crontab: cat /etc/crontab — mineradores se instalam lá para persistir.',
      'Procure arquivos em /tmp: ls /tmp — diretórios ocultos são sinal de comprometimento.'
    ],
    score_cmds: ['top', 'iftop', 'netstat', 'tcpdump', 'auth', 'whois', 'vmstat', 'iostat']
  },

  none: {
    label: 'Nenhum Ataque (tráfego normal)',
    check: 'none',
    status: { cpu: 12, mem: 38, load: '0.21 0.18 0.14', srv: '<span class="green">online</span>', uptime: '9d 3h 14m' },
    top_extra: '<span class="t-line"><span class="blue"> 1842</span> <span class="dim">www</span> <span class="green">  4%</span> <span class="dim">2.1%</span> <span class="green">nginx: worker</span></span>',
    nload: '<span class="t-line"><span class="green">In:  ██ 124 Mbps  (normal)</span></span><span class="t-line"><span class="green">Out: ██  98 Mbps  (normal)</span></span>',
    iftop: '<span class="t-line"><span class="green">192.168.1.5  → 10.0.0.1:80   TCP  48 Mbps</span></span><span class="t-line"><span class="green">192.168.1.7  → 10.0.0.1:443  TCP  32 Mbps</span></span>',
    nethogs: '<span class="t-line"><span class="green">PID 1842  nginx   124 Mbps in  98 Mbps out  (normal)</span></span>',
    ss: '<span class="t-line"><span class="green">ESTABLISHED: 48  TIME-WAIT: 12  (tudo normal)</span></span>',
    netstat: '<span class="t-line"><span class="green">tcp ESTABLISHED 192.168.1.5:44801 → 10.0.0.1:80</span></span><span class="t-line"><span class="green">tcp ESTABLISHED 192.168.1.7:55342 → 10.0.0.1:443</span></span>',
    tcpdump: '<span class="t-line"><span class="dim">12:41:22.114</span>  <span class="green">192.168.1.5 → 10.0.0.1:80  TCP HTTP GET / len=128</span></span><span class="t-line"><span class="dim">12:41:22.312</span>  <span class="green">192.168.1.7 → 10.0.0.1:443 TCP HTTPS len=512</span></span>',
    nginx_log: '<span class="t-line"><span class="green">192.168.1.5 - GET / HTTP/1.1 200 — tráfego normal</span></span><span class="t-line"><span class="green">192.168.1.7 - GET /api HTTP/1.1 200</span></span>',
    auth_log: '<span class="t-line"><span class="green">normal. último login: root 192.168.1.1 (hoje 09:14 — horário comercial)</span></span>',
    syslog: '<span class="t-line"><span class="green">tudo normal. sem entradas críticas ou suspeitas.</span></span>',
    dmesg: '<span class="t-line"><span class="green">nada anômalo.</span></span>',
    whois_ip: '192.168.1.5',
    whois_result: '<span class="t-line"><span class="dim">IP privado RFC1918 — rede interna. Sem informações públicas.</span></span>',
    geoip_result: '<span class="t-line"><span class="green">192.168.1.5 — IP privado RFC1918. Rede local. Normal.</span></span>',
    abuse_result: '<span class="t-line"><span class="dim">IP privado — sem registro público de abuso.</span></span>',
    iostat: '<span class="t-line"><span class="green">normal. %util: 4%</span></span>',
    vmstat: '<span class="t-line"><span class="green">si: 0  us: 8  sy: 3  id: 89 — sistema ocioso e saudável</span></span>',
    iptables: '<span class="t-line"><span class="green">Chain INPUT: regras padrão. Nenhuma anomalia.</span></span>',
    hints: [
      'Analise com cuidado — talvez não haja nada errado mesmo.',
      'Compare os valores com o que seria "normal" para um servidor.',
      'CPU baixa, banda proporcional, logs limpos — tudo ok?',
      'Às vezes o alerta era um falso positivo.'
    ],
    score_cmds: ['status', 'top', 'nload', 'netstat', 'tcpdump']
  }
};

const GUIDES = {
  ddos: {
    title: 'guia: DDoS volumétrico',
    tips: [
      { c: 'hi', t: '<b>Sequência de investigação:</b> <code>nload</code> → <code>iftop</code> → <code>tcpdump</code> → <code>dmesg</code> → <code>whois/geoip/abuse</code>' },
      { c: 'wr', t: '<b>Sinal #1:</b> <code>nload</code> mostra entrada > 10 Gbps com saída normal — assimetria clássica de volumétrico' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>iftop</code> → múltiplos IPs externos diferentes, mesmo protocolo (UDP), mesma porta destino' },
      { c: 'wr', t: '<b>Sinal #3:</b> <code>dmesg</code> → "nf_conntrack: table full" — tabela de conexões do kernel saturada' },
      { c: 'ok', t: '<code>tcpdump</code> mostra pacotes UDP len=1472 (jumbo frames forjados) de dezenas de IPs — padrão botnet' },
      { c: 'ok', t: '<code>vmstat</code> → campo "in" (interrupções) absurdo — NIC gerando interrupções de hardware em flood' },
      { c: 'ok', t: '<code>top</code> → CPU baixa mas servidor degradado — gargalo é na NIC/kernel, não no processo' },
      { c: '', t: '<b>Mitigação:</b> upstream blackhole (RTBH) via NOC, scrubbing center, ou anycast. iptables local é insuficiente.' },
      { c: '', t: '<b>Conceito:</b> Botnet envia tráfego UDP de milhares de IPs comprometidos. Não há handshake — difícil filtrar.' },
      { c: '', t: '<b>Métricas para o relatório:</b> volume em Gbps, número de IPs atacantes, protocolo dominante, ASNs de origem' },
    ]
  },
  syn: {
    title: 'guia: SYN flood',
    tips: [
      { c: 'hi', t: '<b>Sequência:</b> <code>ss -s</code> → <code>netstat</code> → <code>tcpdump</code> → <code>dmesg</code> → <code>vmstat</code>' },
      { c: 'wr', t: '<b>Sinal #1:</b> <code>ss -s</code> → SYN_RECV > 10.000 — tabela de half-open connections cheia' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>dmesg</code> → "TCP: request_sock_TCP: Possible SYN flooding on port 80"' },
      { c: 'wr', t: '<b>Sinal #3:</b> <code>tcpdump</code> → só flag [SYN], jamais [SYN,ACK] completo — handshake nunca termina' },
      { c: 'ok', t: '<code>vmstat</code> → campo cs (context-switch) altíssimo — kernel respondendo SYN-ACK para IPs fantasmas' },
      { c: 'ok', t: '<code>netstat</code> → dezenas de milhares de linhas SYN_RECV do mesmo bloco IP ou IPs aleatórios' },
      { c: 'ok', t: 'CPU alta mas <b>não</b> por processo de aplicação — é o kernel respondendo SYN-ACKs em flood' },
      { c: '', t: '<b>Por que whois não ajuda:</b> IPs de origem são forjados (IP spoofing). O atacante está oculto.' },
      { c: '', t: '<b>Mitigação:</b> SYN cookies (já ativo se dmesg mencionar "Sending cookies"), limitação de rate no iptables' },
      { c: '', t: '<b>Conceito:</b> TCP 3-way handshake: SYN → SYN-ACK → ACK. No flood, o ACK final nunca chega, esgotando a fila.' },
    ]
  },
  http: {
    title: 'guia: HTTP flood (L7)',
    tips: [
      { c: 'hi', t: '<b>Sequência:</b> <code>top</code> → <code>tail nginx.log</code> → <code>iostat</code> → <code>iftop</code> → <code>tcpdump</code>' },
      { c: 'wr', t: '<b>Sinal #1:</b> CPU > 90% em php-fpm ou worker web — ataque é na camada de aplicação, não rede' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>nginx.log</code> → > 10.000 req/s com User-Agents idênticos ou endpoints repetidos (botnet L7)' },
      { c: 'wr', t: '<b>Sinal #3:</b> <code>iostat</code> → %util alto no disco — banco de dados sendo martelado por queries repetitivas' },
      { c: 'ok', t: '<code>top</code> → php-fpm ou apache worker com max_children atingido — novos requests sendo rejeitados' },
      { c: 'ok', t: '<code>iftop</code> → 50–100 IPs distintos, todos na porta 80/443 — botnet L7 distribuída' },
      { c: 'ok', t: 'Volume de rede moderado (2–5 Gbps) — o dano é no processamento HTTP, não no pipe de rede' },
      { c: '', t: '<b>Por que é mais difícil de detectar:</b> requisições são HTTP válidas — WAF/CDN ajudam mais que iptables' },
      { c: '', t: '<b>Mitigação:</b> rate limiting no nginx (limit_req), CAPTCHAs, CDN com bot detection (Cloudflare, AWS Shield)' },
      { c: '', t: '<b>Forense:</b> analise User-Agent, Referer, padrão de URLs — bots costumam ter padrões repetitivos' },
    ]
  },
  amp: {
    title: 'guia: amplificação DNS',
    tips: [
      { c: 'hi', t: '<b>Sequência:</b> <code>nload</code> → <code>iftop</code> → <code>tcpdump</code> → <code>netstat</code> → <code>whois</code>' },
      { c: 'wr', t: '<b>Sinal #1:</b> <code>nload</code> → entrada 20–100x maior que a saída — assimetria extrema (amplificação)' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>iftop</code> → fonte do tráfego é 8.8.8.8, 1.1.1.1, 9.9.9.9 (DNS públicos legítimos)' },
      { c: 'wr', t: '<b>Sinal #3:</b> <code>tcpdump</code> → pacotes UDP porta 53 com len=3000+ (respostas DNS, não queries)' },
      { c: 'ok', t: 'Pergunta-chave: <i>por que o Google DNS estaria me atacando?</i> Não está — foi explorado como refletor.' },
      { c: 'ok', t: '<code>netstat</code> → tráfego UDP de servidores DNS legítimos — confirma reflexão/amplificação' },
      { c: 'ok', t: '<code>dmesg</code> → "nf_conntrack: table full" + erros UDP — kernel descartando pacotes antes do app' },
      { c: '', t: '<b>Como funciona:</b> Atacante forja seu IP nas queries DNS. DNS responde para você com respostas de 3KB (fator 70x).' },
      { c: '', t: '<b>Mitigação:</b> null-route UDP/53 incoming no firewall, upstream RTBH, ou scrubbing center' },
      { c: '', t: '<b>Diagnóstico confirmatório:</b> ratio entrada/saída > 50:1 + fonte exclusivamente DNS = amplificação' },
    ]
  },
  slowloris: {
    title: 'guia: slowloris',
    tips: [
      { c: 'hi', t: '<b>Sequência:</b> <code>nload</code> → <code>ss -s</code> → <code>netstat</code> → <code>tcpdump</code> → <code>nginx.log</code>' },
      { c: 'wr', t: '<b>Armadilha:</b> servidor inacessível, mas CPU e banda estão <b>baixos</b> — parece falso positivo mas não é' },
      { c: 'wr', t: '<b>Sinal #1:</b> <code>ss -s</code> → ESTABLISHED próximo ao MaxClients (ex: 1021/1024)' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>tcpdump</code> → HTTP requests chegando mas nunca completando os headers' },
      { c: 'ok', t: '<code>nload</code> → banda baixa (< 100 Mbps) — descarta completamente DDoS volumétrico' },
      { c: 'ok', t: '<code>netstat</code> → todas as conexões do mesmo IP ou /24, porta 80, todas ESTABLISHED há minutos' },
      { c: 'ok', t: '<code>tcpdump</code> → sequência: GET / HTTP/1.1 → X-Custom: aaa → X-Custom: bbb... (nunca termina)' },
      { c: '', t: '<b>Por que funciona:</b> Apache/nginx mantém conexão aberta aguardando request completo. 1 IP pode saturar.' },
      { c: '', t: '<b>Mitigação:</b> timeout de headers curto (RequestReadTimeout), reverse proxy, nginx na frente do apache' },
      { c: '', t: '<b>Conceito HTTP:</b> Request completo = headers + linha vazia + body. Slowloris nunca envia a linha vazia.' },
    ]
  },
  brute: {
    title: 'guia: brute force SSH',
    tips: [
      { c: 'hi', t: '<b>Sequência:</b> <code>auth.log</code> → <code>iftop</code> → <code>netstat</code> → <code>tcpdump</code> → <code>whois/abuse</code>' },
      { c: 'wr', t: '<b>Sinal #1:</b> <code>auth.log</code> → "Failed password for root" repetindo centenas de vezes por minuto' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>iftop</code> → tráfego alto concentrado na porta 22, de IP externo único' },
      { c: 'wr', t: '<b>Sinal #3:</b> <code>abuse</code> → score 90–100 para SSH brute force / credential stuffing' },
      { c: 'ok', t: 'Servidor HTTP continua funcionando — é ataque de acesso não-autorizado, não de disponibilidade' },
      { c: 'ok', t: '<code>netstat</code> → 40+ conexões simultâneas na porta 22 do mesmo bloco IP' },
      { c: 'ok', t: '<code>tcpdump</code> → flood de TCP handshakes na porta 22 — tentativas de auth em paralelo' },
      { c: '', t: '<b>Risco real:</b> se root tiver senha fraca, o servidor pode ser comprometido. Verifique auth.log por "Accepted".' },
      { c: '', t: '<b>Mitigação:</b> fail2ban, chave SSH (desabilitar senha), porta não-padrão, AllowUsers no sshd_config' },
      { c: '', t: '<b>Diferença importante:</b> brute force ≠ DDoS. Disponibilidade ok, risco é de <i>comprometimento</i>.' },
    ]
  },
  cryptominer: {
    title: 'guia: cryptominer',
    tips: [
      { c: 'hi', t: '<b>Sequência:</b> <code>top/ps aux</code> → <code>iftop/netstat</code> → <code>auth.log</code> → <code>cat /etc/crontab</code> → <code>ls /tmp</code>' },
      { c: 'wr', t: '<b>Sinal #1:</b> CPU > 90% em processo desconhecido (xmrig, minerd, kworker falso)' },
      { c: 'wr', t: '<b>Sinal #2:</b> <code>iftop</code> → saída alta para IP externo porta 3333 ou 4444 (portas de mining pool)' },
      { c: 'wr', t: '<b>Sinal #3:</b> <code>auth.log</code> → "Accepted publickey" em horário incomum (madrugada) dias atrás' },
      { c: 'ok', t: '<code>ps aux</code> → revela <b>path completo</b> do processo: /tmp/.xmr/xmrig — executável em /tmp é anômalo' },
      { c: 'ok', t: '<code>cat /etc/crontab</code> → linha suspeita com xmrig — mecanismo de <b>persistência</b> (reinicia a cada minuto)' },
      { c: 'ok', t: '<code>ls /tmp</code> → diretório oculto .xmr/ → <code>ls /tmp/.xmr</code> → binário e config.json encontrados' },
      { c: '', t: '<b>Resposta a incidente:</b> 1) isole o servidor da rede, 2) preserve evidências, 3) identifique vetor de entrada' },
      { c: '', t: '<b>Vetor provável:</b> senha SSH fraca/reutilizada ou CVE em serviço exposto (PHP, Redis, Confluence...)' },
      { c: '', t: '<b>Não basta matar o processo:</b> o crontab reinicia o miner. Remova a entrada e o diretório /tmp/.xmr.' },
    ]
  },
  none: {
    title: 'guia: sem ataque (falso positivo)',
    tips: [
      { c: 'hi', t: '<b>Habilidade crítica:</b> saber quando <b>não</b> há ataque é tão importante quanto identificar um' },
      { c: 'ok', t: '<b>Baseline normal:</b> CPU < 25%, banda proporcional ao horário, load < número de cores' },
      { c: 'ok', t: '<code>ss -s</code> → ESTABLISHED < 500, sem SYN_RECV, sem CLOSE_WAIT acumulado' },
      { c: 'ok', t: '<code>auth.log</code> → logins apenas de IPs internos, em horário comercial, sem falhas repetidas' },
      { c: 'ok', t: '<code>netstat</code> → conexões apenas para IPs conhecidos (LAN, CDN, banco de dados interno)' },
      { c: '', t: '<b>Falsos positivos comuns:</b> backup noturno, reindexação de banco, deploy com muitas conexões' },
      { c: '', t: '<b>Metodologia:</b> documente o baseline em períodos normais para ter referência durante incidentes' },
      { c: '', t: '<b>Conclusão:</b> reporte como falso positivo com evidências — nenhuma ação corretiva necessária' },
    ]
  }
};

const GUESS_OPTIONS = [
  { k: 'ddos', l: 'DDoS volumétrico' },
  { k: 'syn', l: 'SYN flood' },
  { k: 'http', l: 'HTTP flood (L7)' },
  { k: 'amp', l: 'Amplificação DNS' },
  { k: 'slowloris', l: 'Slowloris' },
  { k: 'brute', l: 'Brute force SSH' },
  { k: 'cryptominer', l: 'Cryptominer' },
  { k: 'none', l: 'Nenhum ataque' },
];

function pickScenario() {
  const keys = Object.keys(SCENARIOS);
  // 'none' aparece 4x vs 2x dos ataques — mais comum para praticar falso positivo
  const pool = [...keys, ...keys, 'none', 'none'];
  return SCENARIOS[pool[Math.floor(Math.random() * pool.length)]];
}
