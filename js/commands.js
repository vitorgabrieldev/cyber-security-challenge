// All command implementations
const CMDS = {

  help() {
    return [
      '',
      '<span class="blue bold">forensics-lab</span> <span class="dim">— terminal de investigação v3.0</span>',
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
      '  <span class="green">vmstat</span>                  memória, I/O, context-switch',
      '  <span class="green">iostat</span>                  I/O de disco',
      '  <span class="green">dmesg | tail</span>            mensagens do kernel',
      '  <span class="green">uptime</span>  <span class="green">free</span>  <span class="green">df</span>        info do sistema',
      '',
      '<span class="yellow">logs</span>',
      '  <span class="green">tail -f /var/log/nginx/access.log</span>',
      '  <span class="green">tail -f /var/log/auth.log</span>',
      '  <span class="green">tail -f /var/log/syslog</span>',
      '  <span class="green">grep &lt;padrão&gt; &lt;arquivo&gt;</span>',
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
      '  <span class="green">report</span>                  relatório da investigação',
      '  <span class="green">timeline</span>                cronologia de eventos',
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
      const w = Math.min(100, v);
      const colors = { green: '#3fb950', yellow: '#d29922', red: '#f85149', blue: '#79c0ff' };
      const filled = '█'.repeat(Math.round(w / 5));
      const empty = '░'.repeat(20 - Math.round(w / 5));
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

  netstat(sc) {
    return [
      '',
      '<span class="dim">Proto  Local              Remoto                Estado</span>',
      '<span class="dim">────────────────────────────────────────────────────────</span>',
      sc.netstat,
      '',
    ];
  },

  ss(sc) {
    return [
      '',
      '<span class="dim">Netid  State    Recv-Q  Send-Q</span>',
      sc.ss,
      '',
    ];
  },

  tcpdump(sc) {
    return [
      '<span class="dim">tcpdump -n -c 15 -i eth0</span>',
      '',
      sc.tcpdump,
      '',
      '<span class="dim">15 packets captured, 15 received by filter, 0 dropped</span>',
      '',
    ];
  },

  iftop(sc) {
    return [
      '',
      '<span class="dim">interface: eth0 — top connections by bandwidth</span>',
      '<span class="dim">────────────────────────────────────────────────</span>',
      sc.iftop,
      '',
    ];
  },

  nload(sc) {
    return [
      '',
      '<span class="dim">nload — eth0 — realtime bandwidth monitor</span>',
      '<span class="dim">────────────────────────────────────────────</span>',
      sc.nload,
      '',
    ];
  },

  nethogs(sc) {
    return [
      '',
      '<span class="dim">NetHogs — tráfego por processo (eth0)</span>',
      '<span class="dim">────────────────────────────────────────</span>',
      sc.nethogs,
      '',
    ];
  },

  vmstat(sc) {
    return [
      '',
      '<span class="dim">procs  memory       swap   io    system      cpu</span>',
      '<span class="dim"> r  b  swpd  free   si  so   bi   bo   in    cs   us  sy  id</span>',
      sc.vmstat,
      '',
    ];
  },

  iostat(sc) {
    return [
      '',
      '<span class="dim">Device  tps   MB_read/s  MB_wrtn/s  %util</span>',
      sc.iostat,
      '',
    ];
  },

  dmesg(sc) {
    return [
      '',
      sc.dmesg,
      '',
    ];
  },

  nginx_log(sc) {
    return [
      '',
      '<span class="dim">→ /var/log/nginx/access.log (últimas entradas)</span>',
      sc.nginx_log,
      '',
    ];
  },

  auth_log(sc) {
    return [
      '',
      '<span class="dim">→ /var/log/auth.log (últimas entradas)</span>',
      sc.auth_log,
      '',
    ];
  },

  syslog(sc) {
    return [
      '',
      '<span class="dim">→ /var/log/syslog (últimas entradas)</span>',
      sc.syslog,
      '',
    ];
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
      sc.iptables,
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

  whois(sc, args) {
    const ip = args[0] || sc.whois_ip;
    return [
      '',
      `<span class="dim">whois ${ip}</span>`,
      sc.whois_result,
      '',
    ];
  },

  geoip(sc, args) {
    const ip = args[0] || sc.whois_ip;
    return [
      '',
      `<span class="dim">geoip ${ip}</span>`,
      sc.geoip_result,
      '',
    ];
  },

  abuse(sc, args) {
    const ip = args[0] || sc.whois_ip;
    return [
      '',
      `<span class="dim">AbuseIPDB — ${ip}</span>`,
      sc.abuse_result,
      '',
    ];
  },

  dig(sc, args) {
    const host = args[0] || 'forensics-lab.local';
    return [
      '',
      `<span class="dim">;; QUESTION SECTION: ${host}</span>`,
      '<span class="dim">;; ANSWER SECTION:</span>',
      `<span class="green">${host}. 300 IN A 10.0.0.1</span>`,
      '',
    ];
  },

  bgp(sc, args) {
    const ip = args[0] || sc.whois_ip;
    return [
      '',
      `<span class="dim">BGP lookup: ${ip}</span>`,
      `  <span class="dim">prefix:</span>    <span class="blue">${ip.split('.').slice(0, 3).join('.')}.0/24</span>`,
      `  <span class="dim">ASN:</span>       <span class="blue">AS${Math.round(Math.random() * 200000 + 10000)}</span>`,
      `  <span class="dim">upstream:</span>  <span class="dim">AS1299, AS3356 (Tier-1 transit)</span>`,
      '',
    ];
  },

  traceroute(sc, args) {
    const ip = args[0] || '8.8.8.8';
    const hops = ['10.0.0.1', '10.10.0.1', '172.16.0.1', '198.51.x.x', ip];
    return [
      '',
      `<span class="dim">traceroute to ${ip}</span>`,
      ...hops.map((h, i) => `<span class="dim">${String(i + 1).padStart(2)}</span>  <span class="blue">${h}</span>  <span class="dim">${Math.round(Math.random() * 20 + 2)}ms</span>`),
      '',
    ];
  },

  uptime(sc) {
    return [`<span class="blue"> ${new Date().toLocaleTimeString('pt-BR')}</span> <span class="dim">up ${sc.status.uptime}, 1 user, load average: ${sc.status.load}</span>`];
  },

  df() {
    return [
      '',
      '<span class="dim">Filesystem      Size  Used  Avail  Use%  Mounted</span>',
      '<span class="green">/dev/sda1       100G   42G    58G   42%  /</span>',
      '<span class="green">tmpfs           4.0G  128M   3.9G    3%  /run</span>',
      '',
    ];
  },

  free(sc) {
    const used = Math.round(8192 * sc.status.mem / 100);
    return [
      '',
      '<span class="dim">              total        used        free      shared</span>',
      `<span class="dim">Mem:           8192        ${used}        ${8192 - used}           0</span>`,
      '',
    ];
  },

  // ── ps aux ──
  psaux(sc) {
    const byScenario = {
      ddos:        '<span class="t-line"><span class="blue">  712</span> <span class="dim">root    </span><span class="red"> 2.0</span> <span class="dim"> 0.1</span> <span class="dim">? R</span> <span class="red">ksoftirqd/0 (net rx — interrupt flood)</span></span>',
      syn:         '<span class="t-line"><span class="blue">    1</span> <span class="dim">root    </span><span class="red">58.0</span> <span class="dim"> 0.1</span> <span class="dim">? R</span> <span class="red">ksoftirqd/0 (SYN-ACK flood)</span></span>',
      http:        '<span class="t-line"><span class="blue"> 2841</span> <span class="dim">www-data</span><span class="red">94.0</span> <span class="dim">12.4</span> <span class="dim">? R</span> <span class="red">php-fpm: pool www (workers esgotados)</span></span>',
      amp:         '<span class="t-line"><span class="blue">    2</span> <span class="dim">root    </span><span class="yellow"> 0.2</span> <span class="dim"> 0.0</span> <span class="dim">? S</span> <span class="yellow">kworker/0:1 (UDP amplification — NIC saturada)</span></span>',
      slowloris:   '<span class="t-line"><span class="blue"> 1842</span> <span class="dim">www-data</span><span class="yellow">31.0</span> <span class="dim"> 8.2</span> <span class="dim">? S</span> <span class="yellow">apache2 (1021 conexões ESTABLISHED — slots cheios)</span></span>',
      brute:       '<span class="t-line"><span class="blue">  981</span> <span class="dim">root    </span><span class="yellow"> 8.0</span> <span class="dim"> 0.4</span> <span class="dim">? S</span> <span class="yellow">sshd: root [priv] (auth attempt flood)</span></span>',
      cryptominer: '<span class="t-line"><span class="blue"> 9871</span> <span class="dim">nobody  </span><span class="red">97.0</span> <span class="dim">14.2</span> <span class="dim">? R</span> <span class="red">/tmp/.xmr/xmrig --pool pool.xmr.pt:3333 --donate-level 0 -t 4</span></span>',
      none:        '',
    };
    const suspicious = byScenario[sc.check] || '';
    return [
      '',
      '<span class="dim">USER       PID  %CPU %MEM STAT COMMAND</span>',
      '<span class="dim">──────────────────────────────────────────────────────────────────────</span>',
      ...(suspicious ? [suspicious] : []),
      '<span class="t-line"><span class="blue"> 1842</span> <span class="dim">www-data </span><span class="green"> 4.0</span> <span class="dim"> 2.1</span> <span class="dim">? S</span> <span class="green">nginx: worker process</span></span>',
      '<span class="t-line"><span class="blue">  981</span> <span class="dim">root     </span><span class="green"> 1.0</span> <span class="dim"> 0.3</span> <span class="dim">? S</span> <span class="green">/usr/sbin/sshd -D</span></span>',
      '<span class="t-line"><span class="blue"> 2201</span> <span class="dim">mysql    </span><span class="green"> 2.0</span> <span class="dim"> 8.4</span> <span class="dim">? S</span> <span class="green">/usr/sbin/mysqld</span></span>',
      '<span class="t-line"><span class="blue">    1</span> <span class="dim">root     </span><span class="green"> 0.0</span> <span class="dim"> 0.1</span> <span class="dim">? S</span> <span class="green">/sbin/init</span></span>',
      '',
      sc.check === 'cryptominer'
        ? '<span class="yellow">[!] PID 9871 rodando de /tmp/.xmr/ — path suspeito (não é sistema)</span>'
        : '',
      '',
    ].filter(l => l !== undefined);
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

  // ── cat /etc/passwd (truncado) ──
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
      return [
        '',
        '<span class="green">auth.log</span>  <span class="dim">auth.log.1</span>  <span class="dim">auth.log.2.gz</span>',
        '<span class="blue">nginx/</span>  <span class="dim">kern.log</span>  <span class="dim">syslog</span>  <span class="dim">syslog.1</span>',
        '<span class="dim">dpkg.log</span>  <span class="dim">apt/</span>  <span class="dim">unattended-upgrades/</span>',
        '',
      ];
    }
    if (path.startsWith('/tmp')) {
      if (sc.check === 'cryptominer') {
        return [
          '',
          '<span class="dim">tmux-0/</span>  <span class="dim">systemd-private-7a3bc/</span>  <span class="red">.xmr/</span>',
          '<span class="red bold">[!] diretório oculto .xmr/ encontrado — investigue com: ls /tmp/.xmr</span>',
          '',
        ];
      }
      return ['', '<span class="dim">tmux-0/  systemd-private-7a3bc/</span>', ''];
    }
    if (path === '/tmp/.xmr') {
      if (sc.check === 'cryptominer') {
        return [
          '',
          '<span class="red">xmrig</span>  <span class="dim">config.json</span>  <span class="dim">.run</span>',
          '<span class="red bold">[!] binário xmrig encontrado — confirma presença de cryptominer</span>',
          '<span class="yellow">dica: cat /tmp/.xmr/config.json</span>',
          '',
        ];
      }
      return [`<span class="red">ls: cannot access '/tmp/.xmr': No such file or directory</span>`, ''];
    }
    if (path.startsWith('/etc')) {
      return [
        '',
        '<span class="dim">apache2/  cron.d/  cron.daily/</span>  <span class="green">crontab</span>  <span class="dim">hosts  hostname</span>',
        '<span class="dim">nginx/  passwd  shadow  sudoers  ssh/  systemd/  ufw/</span>',
        '<span class="dim">logrotate.d/  apt/  dpkg/  modprobe.d/</span>',
        '',
      ];
    }
    if (path.startsWith('/var/log/nginx')) {
      return ['', '<span class="green">access.log</span>  <span class="dim">access.log.1</span>  <span class="dim">error.log</span>  <span class="dim">error.log.1</span>', ''];
    }
    if (path.startsWith('/proc')) {
      return ['', '<span class="dim">1  2  3  …  cpuinfo  meminfo  net/  sys/  uptime  version</span>', ''];
    }
    return [`<span class="red">ls: cannot access '${path}': No such file or directory</span>`, ''];
  },

  // ── find ──
  find(sc, args) {
    const raw = args.join(' ');
    const inTmp = raw.includes('/tmp') || raw.includes('tmp');
    const lookingForXmr = raw.includes('xmr') || raw.includes('xmrig') || raw.includes('.x');
    if (sc.check === 'cryptominer' && (inTmp || lookingForXmr || args.length === 0)) {
      return [
        '',
        '<span class="dim">find /tmp -type f 2>/dev/null</span>',
        '<span class="red">/tmp/.xmr/xmrig</span>',
        '<span class="red">/tmp/.xmr/config.json</span>',
        '<span class="red">/tmp/.xmr/.run</span>',
        '<span class="yellow">[!] binários em /tmp — caminho incomum para executáveis do sistema</span>',
        '',
      ];
    }
    if (inTmp) {
      return ['', '<span class="dim">find /tmp -type f 2>/dev/null</span>', '<span class="dim">(nenhum arquivo suspeito encontrado)</span>', ''];
    }
    return ['', `<span class="dim">find ${args[0] || '.'} — especifique: find /tmp -type f</span>`, ''];
  },

  // ── cat /tmp/.xmr/config.json ──
  xmrConfig(sc) {
    if (sc.check !== 'cryptominer') {
      return [`<span class="red">cat: /tmp/.xmr/config.json: No such file or directory</span>`, ''];
    }
    return [
      '',
      '<span class="dim">→ /tmp/.xmr/config.json</span>',
      '<span class="dim">{</span>',
      '<span class="dim">  "autosave": true,</span>',
      `<span class="red">  "pools": [{ "url": "pool.xmr.pt:3333", "user": "44AFFq5kSiGBoZ..." }],</span>`,
      '<span class="dim">  "threads": 4,</span>',
      '<span class="dim">  "donate-level": 0</span>',
      '<span class="dim">}</span>',
      '<span class="red bold">[!] carteira Monero e pool de mineração identificados</span>',
      '',
    ];
  },

  // ── /proc/cpuinfo (resumido) ──
  cpuinfo(sc) {
    const cores = [0, 1, 2, 3];
    return [
      '',
      '<span class="dim">→ /proc/cpuinfo (resumo)</span>',
      `<span class="dim">model name : Intel(R) Xeon(R) CPU E5-2670 @ 2.60GHz</span>`,
      `<span class="dim">cpu cores  : 4</span>`,
      ...cores.map(i => `<span class="dim">processor ${i}: <span class="${sc.status.cpu > 80 ? 'red' : 'green'}">${sc.status.cpu + (i % 2)}% utilização</span></span>`),
      '',
    ];
  },

  // ══════════════════════════════════════════════
  // Live renderers — retornam array de linhas HTML
  // chamados periodicamente pelo startLive()
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
      sc.top_extra,
      '<span class="t-line"><span class="blue"> 1842</span> <span class="dim">www     </span><span class="green">  4%</span> <span class="dim"> 2.1%</span> <span class="green">nginx: worker process</span></span>',
      '<span class="t-line"><span class="blue">  981</span> <span class="dim">root    </span><span class="green">  1%</span> <span class="dim"> 0.3%</span> <span class="green">sshd</span></span>',
      '<span class="t-line"><span class="blue"> 2201</span> <span class="dim">mysql   </span><span class="green">  2%</span> <span class="dim"> 8.4%</span> <span class="green">mysqld</span></span>',
      '',
      '<span class="dim2">Ctrl+C para sair   q para sair</span>',
    ];
  },

  liveNethogs(sc) {
    const t = new Date().toLocaleTimeString('pt-BR');
    return [
      `<span class="dim">NetHogs — eth0 — ${t}</span>`,
      '<span class="dim">──────────────────────────────────────────────────</span>',
      sc.nethogs,
      '',
      '<span class="dim2">Ctrl+C para sair</span>',
    ];
  },

  liveIftop(sc) {
    const t = new Date().toLocaleTimeString('pt-BR');
    return [
      `<span class="dim">iftop — eth0 — ${t}</span>`,
      '<span class="dim">──────────────────────────────────────────</span>',
      sc.iftop,
      '',
      '<span class="dim2">Ctrl+C para sair</span>',
    ];
  },

  liveNload(sc) {
    const t = new Date().toLocaleTimeString('pt-BR');
    return [
      `<span class="dim">nload — eth0 — ${t}</span>`,
      '<span class="dim">──────────────────────────────────────────</span>',
      sc.nload,
      '',
      '<span class="dim2">Ctrl+C para sair</span>',
    ];
  },

};

const ALL_CMD_NAMES = [
  'help', 'status', 'top', 'htop', 'ps aux', 'netstat -an', 'ss -s', 'tcpdump -n -c 15',
  'iftop', 'nload', 'nethogs', 'vmstat', 'iostat', 'dmesg | tail',
  'tail -f /var/log/nginx/access.log', 'tail -f /var/log/auth.log', 'tail -f /var/log/syslog',
  'grep', 'iptables -nvL', 'nmap', 'whois', 'geoip', 'abuse', 'dig', 'bgp', 'traceroute',
  'cat /etc/crontab', 'cat /etc/passwd', 'cat /proc/cpuinfo', 'cat /tmp/.xmr/config.json',
  'ls /var/log', 'ls /tmp', 'ls /etc', 'find /tmp -type f',
  'hint', 'playbook', 'note adicionar', 'notes', 'ioc', 'report', 'timeline', 'score',
  'history', 'clear', 'whoami', 'uname', 'ls', 'uptime', 'df', 'free',
];
