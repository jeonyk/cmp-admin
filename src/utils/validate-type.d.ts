export type Validate = {
  phoneNumber: (text: string) => boolean;
  email: (text: string) => boolean;
  phoneNumberRaw: () => RegExp;
  emailRaw: () => RegExp;
  ipv6: (text: string) => boolean;
  ipv6Raw: () => RegExp;
  ipv4: (text: string) => boolean;
  ipv4Raw: () => RegExp;
}
