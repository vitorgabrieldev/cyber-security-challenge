# CyberSec Lab — Backlog de Melhorias

---

## Visão Geral da Nova Direção

Migrar de um terminal genérico com sidebar de métricas para uma **simulação fiel do desktop Kali Linux**, onde o investigador precisa usar os próprios comandos para descobrir tudo — sem atalhos na UI. O objetivo do jogo muda de "identificar o ataque" para **"resolver o incidente"**: o cenário só fecha como concluído quando o investigador executa a ação corretiva correta.

---

## 1. Redesign da Interface — Kali Linux Desktop

### 1.1 Visual geral
- Trocar o layout atual por uma simulação de desktop Kali Linux
- Background com wallpaper estilo Kali (padrão preto/dragon)
- Barra superior estilo XFCE/GNOME com: logo Kali, menu de apps, relógio, indicadores de rede
- Barra inferior (dock) com ícones: Terminal, Files, Wireshark, etc. (decorativos ou funcionais)
- Área de trabalho com ícones clicáveis (arquivos .txt, pasta de investigação)

### 1.2 Arquivo de credenciais na área de trabalho
- Ícone de arquivo `access.txt` visível na área de trabalho do Kali
- Conteúdo:
  ```
  === ACESSO AO SERVIDOR ===
  Host:     192.168.0.10
  User:     root
  Password: [gerada por cenário]
  Port:     22
  
  Alerta recebido: [timestamp]
  Descrição: Anomalia detectada. Investigue.
  ```
- O investigador lê o arquivo, abre o terminal, e conecta via `ssh root@192.168.0.10`

### 1.3 Terminal como app separado
- Clicar no ícone de terminal na dock abre uma janela de terminal Kali
- Título da janela: `root@kali:~`
- Prompt padrão Kali: `┌──(root㉿kali)-[~]`  `└─#`
- Suporte a múltiplas janelas de terminal (não abas internas)

### 1.4 Pasta de investigação no desktop
- Pasta `investigation/` na área de trabalho
- Dentro dela, arquivos .txt que substituem os painéis laterais:
  - `ioc.txt` — indicators of compromise (atualizado conforme descobertas)
  - `notes.txt` — anotações do investigador
  - `playbook.txt` — guia de investigação do cenário
- Clicar nos arquivos abre um "editor de texto" simples na tela
- Comandos no terminal também escrevem nesses arquivos:
  - `note "texto"` → append em `investigation/notes.txt`
  - `ioc` → abre `investigation/ioc.txt`

---

## 2. Remoção de Elementos de UI Assistidos

### 2.1 Remover sidebar completamente
- Remover: uptime, status do servidor, timer, contador de comandos, cobertura, IoCs, hints
- Todas essas informações só disponíveis via comando no terminal

### 2.2 Remover ações rápidas
- Remover botões: "Pedir dica", "Ver score", "Relatório", "Limpar tela"
- Equivalentes via comando:
  - `hint` — pede dica
  - `score` — cobertura de evidências
  - `report` — relatório da sessão
  - `clear` — limpa tela

### 2.3 Remover painéis Playbook / Notes / IoC da sidebar
- Substituídos pelos arquivos .txt na pasta `investigation/` do desktop
- Acesso via terminal: `cat investigation/notes.txt`, `cat investigation/ioc.txt`

### 2.4 Informações do servidor: somente via comando
- Status, uptime, CPU, memória, load → apenas via `status`, `top`, `uptime`, `free`
- Nada exibido automaticamente na UI

### 2.5 Informações de investigação: somente via comando
- Timer da sessão → `uptime` ou `elapsed` (comando interno)
- Comandos executados → `history`
- Cobertura de evidências → `score`
- IoCs → `cat investigation/ioc.txt` ou comando `ioc`

---

## 3. Novo Fluxo de Sessão / Cenário

### 3.1 Geração de novo cenário com confirmação
- Remover botão "Novo cenário" da sidebar
- Para iniciar novo cenário, o investigador digita `new-session` ou `reset` no terminal
- Exibir prompt de confirmação:
  ```
  [!] Isso encerrará a sessão atual sem salvar.
  Tem certeza? (s/N): _
  ```
- Só gera novo cenário após confirmação explícita `s` ou `yes`

### 3.2 Mudança de objetivo: de "identificar" para "resolver"
- **Antes:** submeter qual tipo de ataque está ocorrendo → feedback certo/errado
- **Depois:** o cenário só fecha como resolvido quando o investigador executa a **ação corretiva correta**
- Exemplos de ações de resolução por cenário:

| Cenário | Ação para resolver |
|---|---|
| DDoS volumétrico | `iptables -A INPUT -s <ip-atacante> -j DROP` |
| SYN Flood | `sysctl -w net.ipv4.tcp_syncookies=1` |
| HTTP Flood | `iptables -A INPUT -p tcp --dport 80 -m limit --limit 100/min -j ACCEPT` |
| Amplificação DNS | `iptables -A INPUT -p udp --sport 53 -j DROP` |
| Slowloris | `apachectl stop` + `nginx restart` ou timeout config |
| Brute Force SSH | `fail2ban-client status sshd` ou `iptables -A INPUT -s <ip> -j DROP` |
| Cryptominer | `kill 9871` + `crontab -r` + `rm -rf /tmp/.xmr` |
| Ransomware | `kill <pid>` + isolar servidor (sequência de comandos) |
| Webshell | `rm /var/www/html/shell.php` + verificar outros arquivos |
| Botnet C2 | `kill <pid>` + `rm -rf /tmp/.agent` + bloquear IP C2 |
| Log wipe | detectar + `service auditd restart` |

- Feedback ao resolver:
  ```
  ✓ INCIDENTE RESOLVIDO
  Tempo: 08:42 | Comandos: 23 | IoCs coletados: 5
  Ação corretiva: kill 9871 + crontab -r + rm -rf /tmp/.xmr
  ```
- Se o investigador resolver "errado" (ex: matar processo mas não remover crontab), o cenário reinicia em 60s com o miner voltando

---

## 4. Novos Comandos a Implementar

### 4.1 Forensics essenciais (alta prioridade)

| Comando | Descrição |
|---|---|
| `last` / `lastlog` | Logins recentes — padrão absoluto de IR |
| `lsof -i` / `lsof -p <pid>` | Arquivos/sockets abertos por processo |
| `journalctl -xe` | Logs systemd (ambientes Linux modernos) |
| `systemctl status <serviço>` | Status de nginx, sshd, mysql, etc. |
| `crontab -l` | Crontab do usuário atual (≠ /etc/crontab) |
| `file <path>` | Identifica tipo de binário |
| `strings <path>` | Extrai strings de binário — revela URL de C2 |
| `find / -perm -4000` | Busca SUID — essencial em rootkit/escalada |
| `find / -mtime -1` | Arquivos modificados nas últimas 24h |
| `md5sum` / `sha256sum` | Hash de arquivo para IOC |
| `kill <pid>` / `pkill <nome>` | Resposta ao incidente — matar processo |
| `ausearch` / `aureport` | Auditd logs |
| `env` / `printenv` | Variáveis de ambiente do processo suspeito |

### 4.2 Comandos de remediação (para o novo objetivo)

| Comando | Descrição |
|---|---|
| `iptables -A INPUT -s <ip> -j DROP` | Bloquear IP atacante |
| `fail2ban-client status` | Status do fail2ban |
| `sysctl -w <param>=<valor>` | Ajustar parâmetros do kernel |
| `rm -rf <path>` | Remover arquivos maliciosos |
| `crontab -r` | Remover crontab do usuário |
| `service <nome> restart/stop` | Reiniciar/parar serviço |
| `apachectl stop` / `nginx -s reload` | Controle do webserver |
| `passwd root` | Trocar senha comprometida |
| `ssh-keygen -R <ip>` | Remover chave SSH comprometida |

### 4.3 Melhorias de terminal

| Melhoria | Descrição |
|---|---|
| `cd` muda o prompt | `cd /tmp` → prompt vira `root@forensics-lab:/tmp#` |
| `grep -r` | grep recursivo em diretórios |
| `tail -n <N>` | número de linhas configurável |
| `ls -la` | formato longo com permissões, owner, timestamp, arquivos ocultos |
| `Ctrl+D` | encerra sessão SSH |
| Pipe real `\|` | `ps aux \| grep xmrig`, `netstat \| wc -l` |
| `wc -l` | contar linhas |
| `sort` / `uniq -c` | utilitários de texto |

---

## 5. Cenários Incompletos a Finalizar

Os cenários abaixo já existem parcialmente no código (aparecem em `ps aux` e `lsPath`) mas **não têm os campos completos** para ser sorteados. Precisam de: `tcpdump`, `netstat`, `ss`, `nload`, `iftop`, `nethogs`, `nginx_log`, `auth_log`, `syslog`, `dmesg`, `whois_result`, `geoip_result`, `abuse_result`, `iostat`, `vmstat`, `iptables`, `hints`, `score_cmds`, `bw`.

| Cenário | O que falta |
|---|---|
| `ransomware` | Todos os campos de rede/logs + ação de resolução (kill + rm) |
| `webshell` | Logs nginx com requisições à shell, auth_log, resolução (rm webshell) |
| `botnet_c2` | Tráfego C2, netstat com porta 4444, resolução (kill + bloquear IP) |
| `rootkit` | Outputs alterados/ocultados, rkhunter output, resolução complexa |
| `reverse_shell` | Bash reverso visível em ps/netstat, resolução (kill + firewall) |
| `log_wipe` | Logs truncados, processo de limpeza ativo, auditd mostrando a ação |

---

## 6. Melhorias de Timing e Realismo

- `nmap` → delay de 3–5s (scan de porta leva tempo)
- `find /` recursivo → delay de 1–2s
- `strings <binário>` → delay de 0.5s
- `md5sum` → delay de 0.3s
- Respostas do SSH boot com delay de digitação de senha
- Ocasionalmente: `Connection timeout — retrying...` no boot para imersão

---

## 7. Ordem de Implementação Sugerida

### Fase 1 — Fundação (sem redesign visual)
1. Pipe básico: `cmd | grep <pattern>` e `cmd | wc -l`
2. `last` e `lsof`
3. `ls -la` com permissões e timestamps
4. `cd` com mudança de prompt
5. `kill` e `rm -rf` (comandos de remediação)
6. Completar os 6 cenários incompletos

### Fase 2 — Novo objetivo do jogo
7. Lógica de "resolver o incidente" por cenário
8. Validação de sequência de comandos de remediação
9. Feedback de resolução + reinício do cenário se resolução parcial
10. Remoção do painel de "submeter diagnóstico"

### Fase 3 — Redesign Kali Linux
11. Desktop Kali com wallpaper e dock
12. Arquivo `access.txt` na área de trabalho
13. Pasta `investigation/` com arquivos .txt
14. Terminal como janela clicável
15. Remoção completa da sidebar
16. Novo fluxo de `new-session` com confirmação

### Fase 4 — Polish
17. Comandos de remediação restantes
18. Timing variável por comando
19. `journalctl`, `systemctl`, `ausearch`
20. `grep -r`, `tail -n`, `sort`, `uniq`, `wc`

---

## Status

| Item | Status |
|---|---|
| Pipe `\|` | ⬜ Pendente |
| `last` / `lsof` | ⬜ Pendente |
| `ls -la` | ⬜ Pendente |
| `cd` muda prompt | ⬜ Pendente |
| `kill` / `rm -rf` | ⬜ Pendente |
| Cenários incompletos (6) | ⬜ Pendente |
| Lógica de resolução | ⬜ Pendente |
| Desktop Kali | ⬜ Pendente |
| `access.txt` no desktop | ⬜ Pendente |
| Pasta `investigation/` | ⬜ Pendente |
| Remoção da sidebar | ⬜ Pendente |
| `new-session` com confirmação | ⬜ Pendente |
