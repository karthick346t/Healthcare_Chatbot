$ErrorActionPreference = 'Stop'

$body = '{"text":"Hello world","languageCode":"en-US"}'

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:4000/api/tts/speak' -Method Post -ContentType 'application/json' -Body $body
    Write-Output ("STATUS:{0}" -f $response.StatusCode)
    Write-Output $response.Content
}
catch {
    if ($_.Exception.Response) {
        $response = $_.Exception.Response
        $status = [int]$response.StatusCode
        $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
        $content = $reader.ReadToEnd()
        Write-Output ("STATUS:{0}" -f $status)
        Write-Output $content
    }
    else {
        Write-Output $_.Exception.Message
        exit 1
    }
}
