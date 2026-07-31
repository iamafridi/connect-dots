# Use this script to spin up, stop, or resume the 30-node Redis Cluster used by
# the PERF_DEMO benchmark routes (REDIS_CLUSTER=true).
#
# Usage:  .\scripts\redis-cluster.ps1 -Setup
#         .\scripts\redis-cluster.ps1 -Stop
#         .\scripts\redis-cluster.ps1 -Resume
#
# Requires the redis-cli / redis-server binaries on PATH (or point
# $RedisServer / $RedisCli below at your install).

param(
  [switch]$Setup,
  [switch]$Stop,
  [switch]$Resume
)

$ClusterCount = 30
$RedisServer  = "redis-server"
$RedisCli     = "redis-cli"

if (-not ($Setup -or $Stop -or $Resume)) {
  Write-Host "Usage: .\scripts\redis-cluster.ps1 -Setup | -Stop | -Resume"
  exit 1
}

$StartPort = 7000
$EndPort   = $StartPort + $ClusterCount - 1
$ClusterDir = Join-Path (Split-Path $PSScriptRoot -Parent) "redis-cluster"

function New-ClusterConfig {
  param([int]$port)
  $dir = Join-Path $ClusterDir "$port"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  @"
port $port
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000

# Disable persistence so that data is not saved to disk
save ""
appendonly no

protected-mode no
bind 127.0.0.1
maxclients 100000
"@ | Set-Content -Path (Join-Path $dir "redis.conf") -Encoding ascii
}

if ($Setup) {
  foreach ($port in $StartPort..$EndPort) {
    New-ClusterConfig -port $port
    & $RedisServer (Join-Path $ClusterDir "$port\redis.conf") --daemonize yes --dir (Join-Path $ClusterDir "$port")
  }

  Start-Sleep -Seconds 5

  $members = ($StartPort..$EndPort | ForEach-Object { "127.0.0.1:$_" }) -join " "
  & $RedisCli --cluster create $members --cluster-replicas 1 --cluster-yes
} elseif ($Stop) {
  foreach ($port in $StartPort..$EndPort) {
    & $RedisCli -p $port shutdown 2>$null
  }
} elseif ($Resume) {
  foreach ($port in $StartPort..$EndPort) {
    & $RedisServer (Join-Path $ClusterDir "$port\redis.conf") --daemonize yes --dir (Join-Path $ClusterDir "$port")
  }
}