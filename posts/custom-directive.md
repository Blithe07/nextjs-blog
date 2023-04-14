---
title: "Implement custom shortcut commands in the terminal"
date: "2023-04-14"
category: "utils"
---

## Windows

config file url: C:\Users\{userName}\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1

## Mac

config file url: ~/.bashrc

## command

### Windows

```
function Run-Dev{
       $argList = $args -Join ' '
       Start-Process -FilePath 'npm' -ArgumentList "run dev $argList"  -NoNewWindow
}
Set-Alias d  Run-Dev
function Run-Build{
       $argList = $args -Join ' '
       Start-Process -FilePath 'npm' -ArgumentList "run build $argList"  -NoNewWindow
}
Set-Alias b  Run-Build
function Install{
       $argList = $args -Join ' '
       Start-Process -FilePath 'npm' -ArgumentList "install $argList"  -NoNewWindow
}
Set-Alias i  Install
function Run-Start{
       $argList = $args -Join ' '
       Start-Process -FilePath 'npm' -ArgumentList "run start $argList"  -NoNewWindow
}
Set-Alias s  Run-Start
```

### Mac

```
alias d='npm run dev'
```
