"""
Utilitário: converte certificado RNDS para base64 (Railway env var RNDS_CERT_B64).

Uso:
  python scripts/rnds_cert_to_b64.py caminho/para/certificado.pfx
  python scripts/rnds_cert_to_b64.py caminho/para/certificado.cer

Saída: string base64 pronta para colar em RNDS_CERT_B64 no Railway.

O certificado é o arquivo baixado na tela "Implantação e-SUS APS"
(botão "Certificado") — formato .pfx (PKCS#12) ou .cer.
"""
import sys
import base64
import os

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/rnds_cert_to_b64.py <arquivo.pfx|arquivo.cer>")
        sys.exit(1)

    cert_path = sys.argv[1]
    if not os.path.exists(cert_path):
        print(f"Arquivo não encontrado: {cert_path}")
        sys.exit(1)

    with open(cert_path, "rb") as f:
        data = f.read()

    b64 = base64.b64encode(data).decode("ascii")

    print("\n=== RNDS_CERT_B64 (copie para Railway) ===")
    print(b64)
    print(f"\nTamanho: {len(data)} bytes → {len(b64)} chars base64")
    print("\nNo Railway, defina:")
    print(f"  RNDS_CERT_B64  = <string acima>")
    print(f"  RNDS_CNES      = 6820662")
    print(f"  RNDS_CLIENT_ID = <identificador solicitante da tela e-SUS APS>")
    print(f"  RNDS_CLIENT_SECRET = <senha do certificado, se houver>")
    print(f"  RNDS_CERT_PASSWORD = <senha do .pfx, se houver>")

if __name__ == "__main__":
    main()
