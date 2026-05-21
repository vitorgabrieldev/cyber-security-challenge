// Normalize a scenario field (string or array) to an array of HTML line strings
function _lines(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  const parts = String(val).split('<span class="t-line">').slice(1);
  if (!parts.length) return [String(val)];
  return parts.map(p => { const i = p.lastIndexOf('</span>'); return i !== -1 ? p.slice(0, i) : p; });
}

// All command implementations
const CMDS = {

  help() {
    return [
      '',
      '<span class="blue bold">forensics-lab</span> <span class="dim">— terminal de investigação v3.1</span>',
      '<span class="dim">──────────────────────────────────────────────────────────</span>',
      '',
      '<span class="yellow">tráfego e rede</span>',
      '  <span class="green">nload</span>                   gráfico de banda entrada/saída',
      '  <span class="green">iftop</span>                   tráfego por IP em tempo real',
      '  <span class="green">nethogs</span>                 tráfego por processo',
      '  <span class="green">tcpdump</span> <span class="dim">[-n -c N]</span>        captura de pacotes',
      '  <span class="green">netstat -an</span>             conexões e portas',
      '  <span class="green">ss -s</span>                   sumário de estados de socket',
      '  <span class="green">nmap</span>                    port scan do servidor',
      '',
      '<span class="yellow">sistema</span>',
      '  <span class="green">top</span> / <span class="green">htop</span>              processos, CPU, memória',
      '  <span class="green">ps aux</span>                  lista todos os processos',
      '  <span class="green">vmstat</span>                  memória, I/O, context-switch',
      '  <span class="green">iostat</span>                  I/O de disco',
      '  <span class="green">dmesg | tail</span>            mensagens do kernel',
      '  <span class="green">uptime</span>  <span class="green">free</span>  <span class="green">df</span>        info do sistema',
      '',
      '<span class="yellow">logs e arquivos</span>',
      '  <span class="green">tail -f /var/log/nginx/access.log</span>',
      '  <span class="green">tail -f /var/log/auth.log</span>',
      '  <span class="green">tail -f /var/log/syslog</span>',
      '  <span class="green">grep &lt;padrão&gt; &lt;arquivo&gt;</span>   busca em arquivo',
      '  <span class="green">cmd | grep &lt;padrão&gt;</span>       filtra saída (pipe)',
      '  <span class="green">cmd | head -N</span>  <span class="dim">|</span> <span class="green">tail -N</span>  <span class="dim">|</span> <span class="green">wc -l</span>',
      '  <span class="green">ls</span> <span class="dim">[caminho]</span>  <span class="green">cd</span> <span class="dim">[caminho]</span>  <span class="green">pwd</span>',
      '',
      '<span class="yellow">investigação de IPs</span>',
      '  <span class="green">whois &lt;ip&gt;</span>              dono, ASN, país',
      '  <span class="green">geoip &lt;ip&gt;</span>              geolocalização',
      '  <span class="green">abuse &lt;ip&gt;</span>              reputação e histórico',
      '  <span class="green">dig &lt;host&gt;</span>              resolução DNS',
      '  <span class="green">bgp &lt;ip&gt;</span>                informações BGP/ASN',
      '  <span class="green">traceroute &lt;ip&gt;</span>         rota dos pacotes',
      '',
      '<span class="yellow">firewall</span>',
      '  <span class="green">iptables -nvL</span>           listar regras com contadores',
      '',
      '<span class="yellow">forense e jogo</span>',
      '  <span class="green">playbook</span>                guia geral (ou playbook &lt;tipo&gt;)',
      '  <span class="green">hint</span>                    dica sobre o cenário',
      '  <span class="green">note adicionar &lt;txt&gt;</span>    anotar observação',
      '  <span class="green">ioc</span>                     indicators of compromise',
      '  <span class="green">timeline</span>                cronologia de eventos',
      '  <span class="green">report</span>                  relatório da investigação',
      '  <span class="green">score</span>                   cobertura de evidências',
      '  <span class="green">history</span>                 comandos executados',
      '',
    ];
  },

  status(sc) {
    const s = sc.status;
    const cpu = s.cpu;
    const c = cpu > 80 ? 'red' : cpu > 50 ? 'yellow' : 'green';
    const mem = s.mem;
    const mc = mem > 80 ? 'red' : mem > 60 ? 'yellow' : 'green';
    function bar(v, col) {
      const filled = '█'.repeat(Math.round(Math.min(100, v) / 5));
      const empty = '░'.repeat(20 - Math.round(Math.min(100, v) / 5));
      return `<span class="${col}">${filled}</span><span class="dim2">${empty}</span> <span class="${col}">${v}%</span>`;
    }
    return [
      '',
      `<span class="dim">● uptime:</span> <span class="blue">${s.uptime}</span>  <span class="dim">| kernel: 6.1.0-amd64 | 4 cores | 8GB RAM</span>`,
      '',
      `  <span class="dim">cpu      </span> ${bar(cpu, c)}  <span class="dim">load: ${s.load}</span>`,
      `  <span class="dim">mem      </span> ${bar(mem, mc)}`,
      `  <span class="dim">serviço  </span> ${s.srv}`,
      '',
    ];
  },

  top(sc) {
    const s = sc.status;
    const cpu = s.cpu;
    const c = cpu > 80 ? 'red' : cpu > 50 ? 'yellow' : 'green';
    return [
      '',
      `<span class="dim">top - ${new Date().toLocaleTimeString('pt-BR')} up ${s.uptime}, 1 user, load: ${s.load}</span>`,
      `<span class="dim">Tasks: 142 total, ${cpu > 70 ? '<span class="red">12 running</span>' : '2 running'}, 140 sleeping</span>`,
      `<span class="dim">%Cpu: <span class="${c}">${cpu}% us</span>  ${Math.round(cpu * 0.08)}% sy  0% ni  ${Math.max(0, 100 - cpu - Math.round(cpu * 0.08))}% id</span>`,
      `<span class="dim">MiB Mem: 8192 total  ${Math.round(8192 * (1 - s.mem / 100))} free  ${Math.round(8192 * s.mem / 100)} used</span>`,
      '',
      '<span class="dim">  PID   USER   %CPU  %MEM  COMMAND</span>',
      '<span class="dim">  ────────────────────────────────────────────────</span>',
      sc.top_extra,
      '<span class="t-line"><span class="blue"> 1842</span> <span class="dim">www</span>    <span class="green">  4%</span> <span class="dim">2.1%</span> <span class="green">nginx: worker process</span></span>',
      '<span class="t-line"><span class="blue">  981</span> <span class="dim">root</span>   <span class="green">  1%</span> <span class="dim">0.3%</span> <span class="green">sshd</span></span>',
      '<span class="t-line"><span class="blue"> 2201</span> <span class="dim">mysql</span>  <span class="green">  2%</span> <span class="dim">8.4%</span> <span class="green">mysqld</span></span>',
      '',
    ];
  },

  // Log commands — spread arrays from sc
  auth_log(sc) {
    return ['', '<span class="dim">→ /var/log/auth.log (últimas entradas)</span>', ..._lines(sc.auth_log), ''];
  },
  nginx_log(sc) {
    return ['', '<span class="dim">→ /var/log/nginx/access.log (últimas entradas)</span>', ..._lines(sc.nginx_log), ''];
  },
  syslog(sc) {
    return ['', '<span class="dim">→ /var/log/syslog (últimas entradas)</span>', ..._lines(sc.syslog), ''];
  },
  dmesg(sc) {
    return ['', ..._lines(sc.dmesg), ''];
  },
  tcpdump(sc) {
    return [
      '<span class="dim">tcpdump -n -c 15 -i eth0</span>',
      '',
      ..._lines(sc.tcpdump),
      '',
      '<span class="dim">15 packets captured, 15 received by filter, 0 dropped</span>',
      '',
    ];
  },
  netstat(sc) {
    return [
      '',
      '<span class="dim">Proto  Local              Remoto                Estado</span>',
      '<span class="dim">────────────────────────────────────────────────────────</span>',
      ..._lines(sc.netstat),
      '',
    ];
  },
  ss(sc) {
    return ['', '<span class="dim">Netid  State    Recv-Q  Send-Q</span>', ..._lines(sc.ss), ''];
  },

  iftop(sc) {
    return ['', '<span class="dim">interface: eth0 — top connections by bandwidth</span>', '<span class="dim">────────────────────────────────────────────────</span>', ...(sc.bw ? sc.bw.conns.map(c => `<span class="dim">${c.src} → ${c.dst}  ${c.proto}  ${_fmtBw(c.mbps)}</span>`) : _lines(sc.iftop || '')), ''];
  },
  nload(sc) {
    if (!sc.bw) return ['', ..._lines(sc.nload || ''), ''];
    return ['', '<span class="dim">nload — eth0 — realtime bandwidth monitor</span>', `<span class="${sc.bw.in_mbps > 5000 ? 'red' : sc.bw.in_mbps > 500 ? 'yellow' : 'green'}">In:  ${_fmtBw(sc.bw.in_mbps)}</span>`, `<span class="${sc.bw.out_mbps > 5000 ? 'red' : sc.bw.out_mbps > 500 ? 'yellow' : 'green'}">Out: ${_fmtBw(sc.bw.out_mbps)}</span>`, ''];
  },
  nethogs(sc) {
    if (!sc.bw) return ['', ..._lines(sc.nethogs || ''), ''];
    return ['', '<span class="dim">NetHogs — tráfego por processo (eth0)</span>', '<span class="dim">────────────────────────────────────────</span>', ...sc.bw.procs.map(p => `<span class="${(p.in + p.out) > 5000 ? 'red' : (p.in + p.out) > 500 ? 'yellow' : 'green'}">PID ${p.pid}  ${p.name.slice(0, 30).padEnd(32)}  ${_fmtBw(p.in)} in  ${_fmtBw(p.out)} out</span>`), ''];
  },

  vmstat(sc) {
    return ['', '<span class="dim">procs  memory       swap   io    system      cpu</span>', '<span class="dim"> r  b  swpd  free   si  so   bi   bo   in    cs   us  sy  id</span>', ..._lines(sc.vmstat), ''];
  },
  iostat(sc) {
    return ['', '<span class="dim">Device  tps   MB_read/s  MB_wrtn/s  %util</span>', ..._lines(sc.iostat), ''];
  },

  iptables(sc) {
    return [
      '',
      '<span class="dim">Chain INPUT (policy ACCEPT)</span>',
      '<span class="dim"> pkts      bytes  target  proto  source          dest</span>',
      '<span class="dim">───────────────────────────────────────────────────────</span>',
      '<span class="green">  12k   18.2M  ACCEPT  tcp    0.0.0.0/0       dpt:443</span>',
      '<span class="green">   8k    9.1M  ACCEPT  tcp    0.0.0.0/0       dpt:80</span>',
      '<span class="green">  142   14.2K  ACCEPT  tcp    192.168.1.0/24  dpt:22</span>',
      ..._lines(sc.iptables),
      '',
    ];
  },

  nmap() {
    return [
      '',
      '<span class="dim">nmap -sV 10.0.0.1</span>',
      '<span class="dim">Starting Nmap 7.93 (https://nmap.org)</span>',
      '',
      '<span class="green">22/tcp   open  ssh      OpenSSH 9.3p1</span>',
      '<span class="green">80/tcp   open  http     nginx 1.24.0</span>',
      '<span class="green">443/tcp  open  https    nginx 1.24.0</span>',
      '<span class="green">3306/tcp open  mysql    MySQL 8.0.34</span>',
      '',
      '<span class="dim">Nmap done: 1 IP address (1 host up) scanned</span>',
      '',
    ];
  },

  // ── IP Lookup (whois / geoip / abuse) ──
  whois(sc, args) {
    const ip = args[0] || sc.whois_ip;
    if (ip === sc.whois_ip) return ['', `<span class="dim">whois ${ip}</span>`, ..._lines(sc.whois_result), ''];
    const d = _lookupIP(ip);
    if (d.private) return ['', `<span class="dim">whois ${ip}</span>`, '<span class="dim">% IP privado RFC1918 — sem informações públicas</span>', ''];
    return ['', `<span class="dim">whois ${ip}</span>`, `<span class="dim">OrgName: ${d.org}</span>`, `<span class="dim">Country: ${d.country}</span>`, `<span class="dim">ASN:     ${d.asn}</span>`, d.note ? `<span class="yellow">${d.note}</span>` : '', ''];
  },

  geoip(sc, args) {
    const ip = args[0] || sc.whois_ip;
    if (ip === sc.whois_ip) return ['', `<span class="dim">geoip ${ip}</span>`, ..._lines(sc.geoip_result), ''];
    const d = _lookupIP(ip);
    if (d.private) return ['', `<span class="dim">geoip ${ip}</span>`, '<span class="green">IP privado RFC1918. Rede local.</span>', ''];
    return ['', `<span class="dim">geoip ${ip}</span>`, `<span class="blue">${ip}</span> <span class="dim">→</span> <span class="${d.abuse > 50 ? 'red' : 'yellow'}">${d.country}</span> <span class="dim">${d.city} / ${d.org} / ${d.asn}</span>`, d.note ? `<span class="yellow">${d.note}</span>` : '', ''];
  },

  abuse(sc, args) {
    const ip = args[0] || sc.whois_ip;
    if (ip === sc.whois_ip) return ['', `<span class="dim">AbuseIPDB — ${ip}</span>`, ..._lines(sc.abuse_result), ''];
    const d = _lookupIP(ip);
    if (d.private) return ['', `<span class="dim">AbuseIPDB — ${ip}</span>`, '<span class="dim">IP privado — sem registro público de abuso.</span>', ''];
    const col = d.abuse > 60 ? 'red' : d.abuse > 20 ? 'yellow' : 'green';
    return ['', `<span class="dim">AbuseIPDB — ${ip}</span>`, `<span class="${col}">Score: ${d.abuse}/100</span>  <span class="dim">| ${d.org}</span>`, d.note ? `<span class="yellow">${d.note}</span>` : '', ''];
  },

  dig(sc, args) {
    const host = args[0] || 'forensics-lab.local';
    return ['', `<span class="dim">;; QUESTION SECTION: ${host}</span>`, '<span class="dim">;; ANSWER SECTION:</span>', `<span class="green">${host}. 300 IN A 10.0.0.1</span>`, ''];
  },

  bgp(sc, args) {
    const ip = args[0] || sc.whois_ip;
    return ['', `<span class="dim">BGP lookup: ${ip}</span>`, `  <span class="dim">prefix:</span>    <span class="blue">${ip.split('.').slice(0, 3).join('.')}.0/24</span>`, `  <span class="dim">ASN:</span>       <span class="blue">AS${Math.round(Math.random() * 200000 + 10000)}</span>`, `  <span class="dim">upstream:</span>  <span class="dim">AS1299, AS3356 (Tier-1 transit)</span>`, ''];
  },

  traceroute(sc, args) {
    const ip = args[0] || '8.8.8.8';
    const hops = ['10.0.0.1', '10.10.0.1', '172.16.0.1', '198.51.100.1', ip];
    return ['', `<span class="dim">traceroute to ${ip}</span>`, ...hops.map((h, i) => `<span class="dim">${String(i + 1).padStart(2)}</span>  <span class="blue">${h}</span>  <span class="dim">${Math.round(Math.random() * 20 + 2)}ms</span>`), ''];
  },

  uptime(sc) {
    return [`<span class="blue"> ${new Date().toLocaleTimeString('pt-BR')}</span> <span class="dim">up ${sc.status.uptime}, 1 user, load average: ${sc.status.load}</span>`];
  },

  df() {
    return ['', '<span class="dim">Filesystem      Size  Used  Avail  Use%  Mounted</span>', '<span class="green">/dev/sda1       100G   42G    58G   42%  /</span>', '<span class="green">tmpfs           4.0G  128M   3.9G    3%  /run</span>', ''];
  },

  free(sc) {
    const used = Math.round(8192 * sc.status.mem / 100);
    return ['', '<span class="dim">              total        used        free      shared</span>', `<span class="dim">Mem:           8192        ${used}        ${8192 - used}           0</span>`, ''];
  },

  // ── ps aux ──
  psaux(sc) {
    const byScenario = {
      ddos:        '<span class="blue">  712</span> <span class="dim">root    </span><span class="red"> 2.0</span> <span class="dim"> 0.1</span> <span class="dim">? R</span> <span class="red">ksoftirqd/0 (net rx — interrupt flood)</span>',
      syn:         '<span class="blue">    1</span> <span class="dim">root    </span><span class="red">58.0</span> <span class="dim"> 0.1</span> <span class="dim">? R</span> <span class="red">ksoftirqd/0 (SYN-ACK flood)</span>',
      http:        '<span class="blue"> 2841</span> <span class="dim">www-data</span><span class="red">94.0</span> <span class="dim">12.4</span> <span class="dim">? R</span> <span class="red">php-fpm: pool www (workers esgotados)</span>',
      amp:         '<span class="blue">    2</span> <span class="dim">root    </span><span class="yellow"> 0.2</span> <span class="dim"> 0.0</span> <span class="dim">? S</span> <span class="yellow">kworker/0:1 (UDP amplification — NIC saturada)</span>',
      slowloris:   '<span class="blue"> 1842</span> <span class="dim">www-data</span><span class="yellow">31.0</span> <span class="dim"> 8.2</span> <span class="dim">? S</span> <span class="yellow">apache2 (1021 conexões ESTABLISHED — slots cheios)</span>',
      brute:       '<span class="blue">  981</span> <span class="dim">root    </span><span class="yellow"> 8.0</span> <span class="dim"> 0.4</span> <span class="dim">? S</span> <span class="yellow">sshd: root [priv] (auth attempt flood)</span>',
      cryptominer: '<span class="blue"> 9871</span> <span class="dim">nobody  </span><span class="red">97.0</span> <span class="dim">14.2</span> <span class="dim">? R</span> <span class="red">/tmp/.xmr/xmrig --pool pool.xmr.pt:3333 --donate-level 0 -t 4</span>',
      ransomware:  '<span class="blue"> 3341</span> <span class="dim">root    </span><span class="red">88.0</span> <span class="dim">22.1</span> <span class="dim">? R</span> <span class="red">/tmp/.crypt/enc --key a3f... --dir /var/www/html</span>',
      rootkit:     '<span class="blue">  ???</span> <span class="dim">root    </span><span class="red">  ?</span> <span class="dim">  ?</span> <span class="dim">? ?</span> <span class="red">[processos ocultos pelo rootkit — use rkhunter]</span>',
      webshell:    '<span class="blue"> 4412</span> <span class="dim">www-data</span><span class="red">12.0</span> <span class="dim"> 1.8</span> <span class="dim">? S</span> <span class="red">bash -c "id; whoami; cat /etc/passwd" (via webshell)</span>',
      botnet_c2:   '<span class="blue"> 7821</span> <span class="dim">nobody  </span><span class="yellow"> 0.4</span> <span class="dim"> 0.2</span> <span class="dim">? S</span> <span class="yellow">/tmp/.agent/bot --c2 185.220.101.x:4444 --id b3f8a1</span>',
      reverse_shell: '<span class="blue"> 5123</span> <span class="dim">www-data</span><span class="red">1.2</span> <span class="dim"> 0.1</span> <span class="dim">? S</span> <span class="red">bash -i (conectado a 185.220.101.42:4444)</span>',
      log_wipe:    '<span class="blue"> 6621</span> <span class="dim">root    </span><span class="red"> 3.0</span> <span class="dim"> 0.1</span> <span class="dim">? R</span> <span class="red">truncate -s 0 /var/log/auth.log (limpeza de logs)</span>',
      none:        '',
    };
    const suspicious = byScenario[sc.check] || '';
    const lines = [
      '',
      '<span class="dim">USER       PID  %CPU %MEM STAT COMMAND</span>',
      '<span class="dim">──────────────────────────────────────────────────────────────────────</span>',
      ...(suspicious ? [suspicious] : []),
      '<span class="blue"> 1842</span> <span class="dim">www-data </span><span class="green"> 4.0</span> <span class="dim"> 2.1</span> <span class="dim">? S</span> <span class="green">nginx: worker process</span>',
      '<span class="blue">  981</span> <span class="dim">root     </span><span class="green"> 1.0</span> <span class="dim"> 0.3</span> <span class="dim">? S</span> <span class="green">/usr/sbin/sshd -D</span>',
      '<span class="blue"> 2201</span> <span class="dim">mysql    </span><span class="green"> 2.0</span> <span class="dim"> 8.4</span> <span class="dim">? S</span> <span class="green">/usr/sbin/mysqld</span>',
      '<span class="blue">    1</span> <span class="dim">root     </span><span class="green"> 0.0</span> <span class="dim"> 0.1</span> <span class="dim">? S</span> <span class="green">/sbin/init</span>',
      '',
    ];
    if (sc.check === 'cryptominer') lines.push('<span class="yellow">[!] PID 9871 rodando de /tmp/.xmr/ — path suspeito</span>', '');
    if (sc.check === 'ransomware')  lines.push('<span class="red">[!] PID 3341 cifrando arquivos em /var/www/html — RANSOMWARE!</span>', '');
    if (sc.check === 'botnet_c2')   lines.push('<span class="yellow">[!] PID 7821 agente de botnet em /tmp/.agent/ — C2 ativo</span>', '');
    return lines;
  },

  // ── cat /etc/crontab ──
  crontab(sc) {
    const lines = [
      '',
      '<span class="dim">→ /etc/crontab</span>',
      '<span class="dim">───────────────────────────────────────────────────────────────────────────</span>',
      '<span class="dim">SHELL=/bin/sh</span>',
      '<span class="dim">PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin</span>',
      '',
      '<span class="dim">17 *   * * *   root   cd / && run-parts --report /etc/cron.hourly</span>',
      '<span class="dim">25 6   * * *   root   test -x /usr/sbin/anacron || run-parts /etc/cron.daily</span>',
      '<span class="dim">47 6   * * 7   root   test -x /usr/sbin/anacron || run-parts /etc/cron.weekly</span>',
      '<span class="dim">52 6   1 * *   root   test -x /usr/sbin/anacron || run-parts /etc/cron.monthly</span>',
    ];
    if (sc.crontab_extra) {
      lines.push('');
      lines.push(sc.crontab_extra);
      lines.push('<span class="red bold">[!] entrada suspeita encontrada no crontab — persistência!</span>');
    }
    lines.push('');
    return lines;
  },

  // ── cat /etc/passwd ──
  passwd() {
    return [
      '',
      '<span class="dim">→ /etc/passwd</span>',
      '<span class="dim">root:x:0:0:root:/root:/bin/bash</span>',
      '<span class="dim">daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin</span>',
      '<span class="dim">www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin</span>',
      '<span class="dim">mysql:x:116:123:MySQL Server:/nonexistent:/bin/false</span>',
      '<span class="dim">nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin</span>',
      '<span class="dim">sshd:x:105:65534::/run/sshd:/usr/sbin/nologin</span>',
      '',
    ];
  },

  // ── ls com path ──
  lsPath(sc, path) {
    path = (path || '').replace(/\/$/, '');
    if (!path || path === '.' || path === '/root' || path === '~') {
      return ['<span class="blue">logs/</span>  <span class="blue">tools/</span>  <span class="blue">captures/</span>  <span class="dim">README.md  config.yml</span>'];
    }
    if (path === '/var/log' || path === '/var/log/') {
      return ['', '<span class="green">auth.log</span>  <span class="dim">auth.log.1</span>  <span class="dim">auth.log.2.gz</span>', '<span class="blue">nginx/</span>  <span class="dim">kern.log</span>  <span class="dim">syslog</span>  <span class="dim">syslog.1</span>', '<span class="dim">dpkg.log</span>  <span class="dim">apt/</span>  <span class="dim">unattended-upgrades/</span>', ''];
    }
    if (path.startsWith('/tmp')) {
      if (sc.check === 'cryptominer') {
        return ['', '<span class="dim">tmux-0/</span>  <span class="dim">systemd-private-7a3bc/</span>  <span class="red">.xmr/</span>', '<span class="red bold">[!] diretório oculto .xmr/ — investigue: ls /tmp/.xmr</span>', ''];
      }
      if (sc.check === 'ransomware') {
        return ['', '<span class="dim">tmux-0/</span>  <span class="dim">systemd-private-7a3bc/</span>  <span class="red">.crypt/</span>', '<span class="red bold">[!] diretório oculto .crypt/ — ransomware!  ls /tmp/.crypt</span>', ''];
      }
      if (sc.check === 'botnet_c2') {
        return ['', '<span class="dim">tmux-0/</span>  <span class="red">.agent/</span>', '<span class="red bold">[!] agente botnet em /tmp/.agent/ — ls /tmp/.agent</span>', ''];
      }
      if (sc.check === 'webshell') {
        return ['', '<span class="dim">tmux-0/</span>  <span class="red">shell.php</span>  <span class="red">upload_test.php</span>', '<span class="yellow">[!] arquivos PHP em /tmp — caminho suspeito</span>', ''];
      }
      if (sc.check === 'reverse_shell') {
        return ['', '<span class="dim">tmux-0/</span>  <span class="red">.sh</span>  <span class="red">.backdoor</span>', '<span class="red">[!] arquivos ocultos em /tmp — possível backdoor</span>', ''];
      }
      return ['', '<span class="dim">tmux-0/  systemd-private-7a3bc/</span>', ''];
    }
    if (path === '/tmp/.xmr') {
      if (sc.check === 'cryptominer') return ['', '<span class="red">xmrig</span>  <span class="dim">config.json</span>  <span class="dim">.run</span>', '<span class="red bold">[!] binário xmrig — confirma cryptominer</span>', '<span class="yellow">dica: cat /tmp/.xmr/config.json</span>', ''];
      return [`<span class="red">ls: cannot access '/tmp/.xmr': No such file or directory</span>`, ''];
    }
    if (path.startsWith('/etc')) {
      return ['', '<span class="dim">apache2/  cron.d/  cron.daily/</span>  <span class="green">crontab</span>  <span class="dim">hosts  hostname</span>', '<span class="dim">nginx/  passwd  shadow  sudoers  ssh/  systemd/  ufw/</span>', '<span class="dim">logrotate.d/  apt/  dpkg/  modprobe.d/</span>', ''];
    }
    if (path.startsWith('/var/log/nginx')) {
      return ['', '<span class="green">access.log</span>  <span class="dim">access.log.1</span>  <span class="dim">error.log</span>  <span class="dim">error.log.1</span>', ''];
    }
    if (path.startsWith('/proc')) {
      return ['', '<span class="dim">1  2  3  …  cpuinfo  meminfo  net/  sys/  uptime  version</span>', ''];
    }
    return [`<span class="red">ls: cannot access '${path}': No such file or directory</span>`, ''];
  },

  // ── ls -la ──
  lsLong(sc, path) {
    path = (path || '').replace(/\/$/, '');
    const D = [
      'May 01','May 03','May 07','May 09','May 11','May 14','May 15','May 17',
    ];
    let di = 0;
    const ts = () => D[di++ % D.length];

    if (!path || path === '.' || path === '/root' || path === '~') {
      return [
        '', '<span class="dim">total 48</span>',
        `<span class="dim">drwx------  5 root root 4096 ${ts()} <span class="blue">.</span></span>`,
        `<span class="dim">drwxr-xr-x 20 root root 4096 ${ts()} <span class="blue">..</span></span>`,
        `<span class="dim">-rw-r--r--  1 root root  220 ${ts()} .bash_logout</span>`,
        `<span class="dim">-rw-r--r--  1 root root 3526 ${ts()} .bashrc</span>`,
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">captures</span></span>`,
        `<span class="dim">-rw-------  1 root root  876 ${ts()} .lesshst</span>`,
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">logs</span></span>`,
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">tools</span></span>`,
        `<span class="dim">-rw-r--r--  1 root root  168 ${ts()} .profile</span>`,
        '',
      ];
    }
    if (path === '/var/log' || path === '/var/log/') {
      return [
        '', '<span class="dim">total 2140</span>',
        `<span class="green">-rw-r-----  1 syslog adm   87432 ${ts()} auth.log</span>`,
        `<span class="dim">-rw-r-----  1 syslog adm   12834 ${ts()} auth.log.1</span>`,
        `<span class="dim">-rw-r-----  1 syslog adm    2301 ${ts()} auth.log.2.gz</span>`,
        `<span class="dim">drwxr-xr-x  2 www-data root  4096 ${ts()} <span class="blue">nginx</span></span>`,
        `<span class="dim">-rw-r--r--  1 root root  198234 ${ts()} syslog</span>`,
        `<span class="dim">-rw-r--r--  1 root root   45128 ${ts()} syslog.1</span>`,
        `<span class="dim">-rw-r--r--  1 root root    2143 ${ts()} kern.log</span>`,
        `<span class="dim">-rw-r--r--  1 root root   12893 ${ts()} dpkg.log</span>`,
        '',
      ];
    }
    if (path.startsWith('/tmp')) {
      const base = [
        '', '<span class="dim">total 24</span>',
        `<span class="dim">drwxrwxrwt  6 root root   4096 ${ts()} <span class="blue">.</span></span>`,
        `<span class="dim">drwxr-xr-x 20 root root   4096 ${ts()} <span class="blue">..</span></span>`,
        `<span class="dim">drwx------  2 root root   4096 ${ts()} <span class="blue">systemd-private-7a3bc</span></span>`,
        `<span class="dim">drwx------  2 root root   4096 ${ts()} <span class="blue">tmux-0</span></span>`,
      ];
      if (sc.check === 'cryptominer') { base.push(`<span class="red">drwxr-xr-x  2 nobody nogroup 4096 ${ts()} <span class="red bold">.xmr</span></span>`, '<span class="red bold">[!] diretório oculto .xmr/ com SUID — investigue: ls -la /tmp/.xmr</span>'); }
      if (sc.check === 'ransomware')  { base.push(`<span class="red">drwxr-xr-x  2 root root   4096 ${ts()} <span class="red bold">.crypt</span></span>`); }
      if (sc.check === 'botnet_c2')   { base.push(`<span class="red">drwxr-xr-x  2 nobody nogroup 4096 ${ts()} <span class="red bold">.agent</span></span>`); }
      if (sc.check === 'webshell')    { base.push(`<span class="red">-rwxr-xr-x  1 www-data www-data 4120 ${ts()} <span class="red bold">shell.php</span></span>`); }
      if (sc.check === 'reverse_shell') { base.push(`<span class="red">-rwx------  1 www-data www-data 8241 ${ts()} <span class="red bold">.sh</span></span>`); }
      base.push('');
      return base;
    }
    if (path.startsWith('/etc')) {
      return [
        '', '<span class="dim">total 256</span>',
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">apache2</span></span>`,
        `<span class="dim">-rw-r--r--  1 root root  722 ${ts()} crontab</span>`,
        `<span class="dim">-rw-r--r--  1 root root 1491 ${ts()} group</span>`,
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">nginx</span></span>`,
        `<span class="dim">-rw-r--r--  1 root root 2812 ${ts()} passwd</span>`,
        `<span class="dim">-rw-------  1 root root 1342 ${ts()} shadow</span>`,
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">ssh</span></span>`,
        `<span class="dim">drwxr-xr-x  2 root root 4096 ${ts()} <span class="blue">systemd</span></span>`,
        '',
      ];
    }
    if (path.startsWith('/var/log/nginx')) {
      return [
        '', '<span class="dim">total 1284</span>',
        `<span class="green">-rw-r--r--  1 www-data adm  482341 ${ts()} access.log</span>`,
        `<span class="dim">-rw-r--r--  1 www-data adm   92841 ${ts()} access.log.1</span>`,
        `<span class="dim">-rw-r--r--  1 www-data adm    4312 ${ts()} error.log</span>`,
        '',
      ];
    }
    return CMDS.lsPath(sc, path);
  },

  // ── grep -r (recursive across log files) ──
  grepRecursive(sc, pattern, dir) {
    const files = {
      '/var/log/auth.log':         CMDS.auth_log(sc),
      '/var/log/nginx/access.log': CMDS.nginx_log(sc),
      '/var/log/syslog':           CMDS.syslog(sc),
    };
    function stripHtml(h) { return String(h).replace(/<[^>]+>/g, ''); }
    let re;
    try { re = new RegExp(pattern, 'i'); } catch(e) { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
    const results = [];
    for (const [fname, lines] of Object.entries(files)) {
      if (!dir || dir === '/' || fname.startsWith(dir) || dir.startsWith('/var') || dir.startsWith('/root')) {
        lines.forEach(l => {
          if (l && re.test(stripHtml(l))) {
            results.push(`<span class="fp-path">${fname}:</span>${l}`);
          }
        });
      }
    }
    return results.length ? ['', ...results, ''] : ['<span class="dim">(sem resultados)</span>', ''];
  },

  // ── find ──
  find(sc, args) {
    const raw = args.join(' ');
    const inTmp = raw.includes('/tmp') || raw.includes('tmp');
    if (sc.check === 'cryptominer' && (inTmp || args.length === 0)) {
      return ['', '<span class="dim">find /tmp -type f 2>/dev/null</span>', '<span class="red">/tmp/.xmr/xmrig</span>', '<span class="red">/tmp/.xmr/config.json</span>', '<span class="red">/tmp/.xmr/.run</span>', '<span class="yellow">[!] binários em /tmp — caminho incomum</span>', ''];
    }
    if (sc.check === 'ransomware' && inTmp) {
      return ['', '<span class="dim">find /tmp -type f 2>/dev/null</span>', '<span class="red">/tmp/.crypt/enc</span>', '<span class="red">/tmp/.crypt/config.json</span>', '<span class="red">/tmp/.crypt/README_RECOVERY.txt</span>', '<span class="yellow">[!] ransomware toolkit em /tmp</span>', ''];
    }
    if (sc.check === 'botnet_c2' && inTmp) {
      return ['', '<span class="dim">find /tmp -type f 2>/dev/null</span>', '<span class="red">/tmp/.agent/bot</span>', '<span class="red">/tmp/.agent/config.enc</span>', '<span class="yellow">[!] agente botnet em /tmp/.agent</span>', ''];
    }
    if (inTmp) return ['', '<span class="dim">find /tmp -type f 2>/dev/null</span>', '<span class="dim">(nenhum arquivo suspeito encontrado)</span>', ''];
    return ['', `<span class="dim">find ${args[0] || '.'} — especifique: find /tmp -type f</span>`, ''];
  },

  // ── cat /tmp/.xmr/config.json ──
  xmrConfig(sc) {
    if (sc.check !== 'cryptominer') return [`<span class="red">cat: /tmp/.xmr/config.json: No such file or directory</span>`, ''];
    return [
      '', '<span class="dim">→ /tmp/.xmr/config.json</span>', '<span class="dim">{</span>',
      '<span class="dim">  "autosave": true,</span>',
      '<span class="red">  "pools": [{ "url": "pool.xmr.pt:3333", "user": "44AFFq5kSiGBoZ..." }],</span>',
      '<span class="dim">  "threads": 4, "donate-level": 0</span>',
      '<span class="dim">}</span>',
      '<span class="red bold">[!] carteira Monero e pool de mineração identificados</span>',
      '',
    ];
  },

  // ── /proc/cpuinfo ──
  cpuinfo(sc) {
    return [
      '', '<span class="dim">→ /proc/cpuinfo (resumo)</span>',
      '<span class="dim">model name : Intel(R) Xeon(R) CPU E5-2670 @ 2.60GHz</span>',
      '<span class="dim">cpu cores  : 4</span>',
      ...[0, 1, 2, 3].map(i => `<span class="dim">processor ${i}: <span class="${sc.status.cpu > 80 ? 'red' : 'green'}">${sc.status.cpu + (i % 2)}% utilização</span></span>`),
      '',
    ];
  },

  // ── grep filter (used by pipe and standalone) ──
  grepFilter(lines, pattern, invert = false) {
    function stripHtml(h) { return String(h).replace(/<[^>]+>/g, ''); }
    let re;
    try { re = new RegExp(pattern, 'i'); }
    catch(e) { re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); }
    return lines.filter(line => {
      if (!line) return false;
      const text = stripHtml(line);
      if (!text.trim() || text === ' ') return false;
      return invert ? !re.test(text) : re.test(text);
    });
  },

  // ══════════════════════════════════════════════
  // Live renderers — return array of HTML lines
  // ══════════════════════════════════════════════
  liveTop(sc) {
    const jit = (v, r) => Math.max(0, Math.min(100, v + Math.round((Math.random() - 0.5) * r)));
    const cpu = jit(sc.status.cpu, 4);
    const mem = jit(sc.status.mem, 2);
    const cc  = cpu > 80 ? 'red' : cpu > 50 ? 'yellow' : 'green';
    const mc  = mem > 80 ? 'red' : mem > 60 ? 'yellow' : 'green';
    const t   = new Date().toLocaleTimeString('pt-BR');
    return [
      `<span class="dim">top - ${t} up ${sc.status.uptime}  load: ${sc.status.load}</span>`,
      `<span class="dim">Tasks: 142 total, ${cpu > 70 ? '<span class="red">12 running</span>' : '2 running'}, 140 sleeping</span>`,
      `<span class="dim">%Cpu(s): <span class="${cc}">${cpu}.0 us</span>  ${Math.round(cpu * 0.08)}.0 sy  ${Math.max(0, 100 - cpu - Math.round(cpu * 0.08))}.0 id</span>`,
      `<span class="dim">MiB Mem: 8192 total  <span class="${mc}">${Math.round(8192 * mem / 100)} used</span>  ${Math.round(8192 * (1 - mem / 100))} free</span>`,
      '',
      '<span class="dim">  PID   USER    %CPU %MEM  COMMAND</span>',
      '<span class="dim">  ──────────────────────────────────────────────────────────────────</span>',
      ..._lines(sc.top_extra),
      '<span class="blue"> 1842</span> <span class="dim">www     </span><span class="green">  4%</span> <span class="dim"> 2.1%</span> <span class="green">nginx: worker process</span>',
      '<span class="blue">  981</span> <span class="dim">root    </span><span class="green">  1%</span> <span class="dim"> 0.3%</span> <span class="green">sshd</span>',
      '<span class="blue"> 2201</span> <span class="dim">mysql   </span><span class="green">  2%</span> <span class="dim"> 8.4%</span> <span class="green">mysqld</span>',
      '',
      '<span class="dim2">Ctrl+C para sair   q para sair</span>',
    ];
  },

  liveNethogs(sc) {
    if (!sc.bw) { const t = new Date().toLocaleTimeString('pt-BR'); return [`<span class="dim">NetHogs — eth0 — ${t}</span>`, '<span class="dim">──────────────────────────────────────────────────────</span>', '<span class="dim">PID    PROCESS                          IN           OUT</span>', ..._lines(sc.nethogs || ''), '', '<span class="dim2">Ctrl+C para sair</span>']; }
    const t = new Date().toLocaleTimeString('pt-BR');
    const jit = v => Math.max(0.01, v * (1 + (Math.random() - 0.5) * 0.30));
    const fmt = v => _fmtBw(v);
    const rows = sc.bw.procs.map(p => {
      const inV = jit(p.in), outV = jit(p.out);
      const total = inV + outV;
      const col = total > 5000 ? 'red' : total > 500 ? 'yellow' : 'green';
      const name = p.name.length > 28 ? '…' + p.name.slice(-27) : p.name;
      return `<span class="${col}">PID ${String(p.pid).padStart(5)}  ${name.padEnd(30)}  ${fmt(inV).padStart(10)} in   ${fmt(outV).padStart(10)} out</span>`;
    });
    return [
      `<span class="dim">NetHogs — eth0 — ${t}</span>`,
      '<span class="dim">──────────────────────────────────────────────────────</span>',
      '<span class="dim">PID    PROCESS                          IN           OUT</span>',
      ...rows,
      '',
      '<span class="dim2">Ctrl+C para sair</span>',
    ];
  },

  liveIftop(sc) {
    if (!sc.bw) { const t = new Date().toLocaleTimeString('pt-BR'); return [`<span class="dim">iftop — eth0 — ${t}</span>`, '<span class="dim">──────────────────────────────────────────</span>', ..._lines(sc.iftop || ''), '', '<span class="dim2">Ctrl+C para sair</span>']; }
    const t = new Date().toLocaleTimeString('pt-BR');
    const jit = v => Math.max(0.01, v * (1 + (Math.random() - 0.5) * 0.24));
    const rows = sc.bw.conns.map(c => {
      const mbps = jit(c.mbps);
      const col = mbps > 5000 ? 'red' : mbps > 500 ? 'yellow' : 'green';
      return `<span class="${col}">${c.src.padEnd(22)} → ${c.dst.padEnd(20)} ${c.proto.padEnd(8)} ${_fmtBw(mbps)}</span>`;
    });
    return [
      `<span class="dim">iftop — eth0 — ${t}</span>`,
      '<span class="dim">──────────────────────────────────────────</span>',
      ...rows,
      '',
      '<span class="dim2">Ctrl+C para sair</span>',
    ];
  },

  liveNload(sc) {
    if (!sc.bw) { const t = new Date().toLocaleTimeString('pt-BR'); return [`<span class="dim">nload — eth0 — ${t}</span>`, '<span class="dim">─────────────────────────────────────────</span>', ..._lines(sc.nload || ''), '', '<span class="dim2">Ctrl+C para sair</span>']; }
    const t = new Date().toLocaleTimeString('pt-BR');
    const jit = v => Math.max(0.01, v * (1 + (Math.random() - 0.5) * 0.16));
    const inV = jit(sc.bw.in_mbps), outV = jit(sc.bw.out_mbps);
    const maxV = Math.max(inV, outV, 1);
    const bar = (v, col) => {
      const len = Math.max(1, Math.round(v / maxV * 24));
      return `<span class="${col}">${'█'.repeat(len)} ${_fmtBw(v)}</span>`;
    };
    const ic = inV > 5000 ? 'red' : inV > 500 ? 'yellow' : 'green';
    const oc = outV > 5000 ? 'red' : outV > 500 ? 'yellow' : 'green';
    return [
      `<span class="dim">nload — eth0 — ${t}</span>`,
      '<span class="dim">─────────────────────────────────────────</span>',
      `<span class="dim">In:  </span>${bar(inV, ic)}`,
      `<span class="dim">Out: </span>${bar(outV, oc)}`,
      '',
      '<span class="dim2">Ctrl+C para sair</span>',
    ];
  },

  // Legacy fallbacks (scenarios without bw)
  _legacyLiveNethogs(sc) {
    return [`<span class="dim">NetHogs — eth0 — ${new Date().toLocaleTimeString('pt-BR')}</span>`, '<span class="dim">sem dados de processo disponíveis</span>', '', '<span class="dim2">Ctrl+C para sair</span>'];
  },
  _legacyLiveIftop(sc) {
    return [`<span class="dim">iftop — eth0 — ${new Date().toLocaleTimeString('pt-BR')}</span>`, '<span class="dim">sem dados de conexão disponíveis</span>', '', '<span class="dim2">Ctrl+C para sair</span>'];
  },
  _legacyLiveNload(sc) {
    return [`<span class="dim">nload — eth0 — ${new Date().toLocaleTimeString('pt-BR')}</span>`, '<span class="dim">sem dados de banda disponíveis</span>', '', '<span class="dim2">Ctrl+C para sair</span>'];
  },
};

// ── IP lookup helpers ──
const _KNOWN_IPS = {
  '8.8.8.8':    { org: 'Google LLC', country: 'US', asn: 'AS15169', city: 'Mountain View', abuse: 0, note: 'DNS público Google — legítimo, pode ser usado como refletor' },
  '1.1.1.1':    { org: 'Cloudflare Inc', country: 'AU', asn: 'AS13335', city: 'Sydney', abuse: 0, note: 'DNS público Cloudflare — legítimo' },
  '9.9.9.9':    { org: 'Quad9 Foundation', country: 'CH', asn: 'AS19281', city: 'Zurich', abuse: 0, note: 'DNS público Quad9 — legítimo' },
  '4.2.2.2':    { org: 'Level3 Communications', country: 'US', asn: 'AS3356', city: 'Denver', abuse: 5, note: 'DNS Level3 — legítimo' },
  '208.67.222.222': { org: 'Cisco OpenDNS', country: 'US', asn: 'AS36692', city: 'San Francisco', abuse: 0, note: 'OpenDNS Cisco — legítimo' },
  '45.32.14.8': { org: 'Vultr Holdings LLC', country: 'NL', asn: 'AS20473', city: 'Amsterdam', abuse: 84, note: 'Hosting/VPS — pool de mineração XMR conhecido' },
  '185.220.101.42': { org: 'Tor Exit Node', country: 'DE', asn: 'AS213151', city: 'Frankfurt', abuse: 92, note: 'Nó de saída Tor — frequentemente usado em ataques' },
  '104.21.82.4': { org: 'Cloudflare Inc', country: 'US', asn: 'AS13335', city: 'San Jose', abuse: 15, note: 'IP Cloudflare — pode ser proxy/IP forjado em ataques' },
};

function _isPrivateIP(ip) {
  return ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('127.') ||
    ip === 'localhost' || ip.startsWith('::1');
}

function _lookupIP(ip) {
  if (_isPrivateIP(ip)) return { org: 'RFC1918', country: 'N/A', asn: 'N/A', city: 'local', abuse: 0, private: true };
  if (_KNOWN_IPS[ip]) return _KNOWN_IPS[ip];
  // Generate plausible data from octets
  const parts = ip.split('.').map(Number);
  const seed = (parts[0] || 0) * 1000 + (parts[1] || 0);
  const countries = ['DE', 'NL', 'FR', 'GB', 'US', 'BR', 'CN', 'RU', 'UA', 'IN', 'SG'];
  const orgs = ['DigitalOcean LLC', 'Hetzner Online GmbH', 'OVH SAS', 'Amazon AWS', 'Linode LLC', 'Vultr Holdings', 'Contabo GmbH', 'Leaseweb'];
  const cities = ['Frankfurt', 'Amsterdam', 'London', 'Paris', 'New York', 'Singapore', 'Moscow', 'Ashburn'];
  const ci = seed % countries.length;
  const oi = seed % orgs.length;
  return {
    org: orgs[oi],
    country: countries[ci],
    asn: `AS${10000 + seed}`,
    city: cities[ci % cities.length],
    abuse: Math.round((seed % 80) + 10),
    note: null,
  };
}

function _fmtBw(mbps) {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
  if (mbps >= 1)    return `${Math.round(mbps)} Mbps`;
  return `${Math.round(mbps * 1000)} Kbps`;
}

const ALL_CMD_NAMES = [
  'help', 'status', 'top', 'htop', 'ps aux', 'netstat -an', 'ss -s', 'tcpdump -n -c 15',
  'iftop', 'nload', 'nethogs', 'vmstat', 'iostat', 'dmesg | tail',
  'tail -f /var/log/nginx/access.log', 'tail -f /var/log/auth.log', 'tail -f /var/log/syslog',
  'tail -n 20 /var/log/auth.log', 'tail -n 50 /var/log/nginx/access.log',
  'grep', 'grep -r', 'grep -v', 'iptables -nvL', 'nmap', 'whois', 'geoip', 'abuse', 'dig', 'bgp', 'traceroute',
  'cat /etc/crontab', 'cat /etc/passwd', 'cat /proc/cpuinfo', 'cat /tmp/.xmr/config.json',
  'ls /var/log', 'ls /tmp', 'ls /etc', 'ls -la', 'ls -la /tmp', 'ls -la /var/log', 'ls -la /etc',
  'find /tmp -type f', 'find / -mtime -1', 'find / -perm -4000',
  'cd /tmp', 'cd /var/log', 'cd /etc', 'cd /root', 'pwd',
  'kill', 'pkill', 'rm -rf',
  'wc -l', 'sort', 'sort -r', 'uniq -c',
  'hint', 'playbook', 'note adicionar', 'notes', 'ioc', 'report', 'timeline', 'score',
  'history', 'clear', 'whoami', 'uname', 'ls', 'uptime', 'df', 'free',
];
