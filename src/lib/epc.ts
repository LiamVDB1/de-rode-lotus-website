import QRCode from 'qrcode';

export interface EpcInput {
  beneficiary: string;
  iban: string;
  bic: string;
  amount?: number;
  remittance: string;
}

/** EPC069-12 "SEPA Credit Transfer"-QR: scanbaar door de meeste Belgische bankapps. */
export function epcPayload({ beneficiary, iban, bic, amount, remittance }: EpcInput): string {
  const clean = (value: string, max: number) => value.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
  return [
    'BCD',
    '002',
    '1',
    'SCT',
    clean(bic, 11),
    clean(beneficiary, 70),
    iban.replace(/\s+/g, '').toUpperCase(),
    amount ? `EUR${amount.toFixed(2)}` : '',
    '',
    '',
    clean(remittance, 140),
  ].join('\n');
}

export async function epcSvg(input: EpcInput): Promise<string> {
  return QRCode.toString(epcPayload(input), { type: 'svg', errorCorrectionLevel: 'M', margin: 2, color: { dark: '#20231f', light: '#ffffff' } });
}

/** BE12 3456 7890 1234 */
export function formatIban(iban: string): string {
  return iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
}
