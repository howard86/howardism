/* eslint-disable jsx-a11y/anchor-is-valid */

import { Image, Link, StyleSheet, Text, View } from "@react-pdf/renderer";

export const ResumeIconType = {
  address: 0,
  phone: 1,
  email: 2,
  github: 3,
  website: 4,
} as const;
export type ResumeIconType =
  (typeof ResumeIconType)[keyof typeof ResumeIconType];

const RESUME_ICON_NAMES = [
  "address",
  "phone",
  "email",
  "github",
  "website",
] as const;

interface ResumeContactProps {
  content: string;
  type: ResumeIconType;
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  icon: {
    width: 10,
    height: 10,
    marginRight: 4,
  },
});

function ResumeContentItem({ type, content }: ResumeContactProps) {
  switch (type) {
    case ResumeIconType.phone:
      return <Link src={`tel:${content}`}>{content}</Link>;

    case ResumeIconType.email:
      return <Link src={`mailto:${content}`}>{content}</Link>;

    case ResumeIconType.github:
      return <Link src={`https://github.com/${content}`}>{content}</Link>;

    case ResumeIconType.website:
      return <Link src={content}>{content.replace("https://", "")}</Link>;

    default:
      return <Text>{content}</Text>;
  }
}

export default function ResumeContact({ type, content }: ResumeContactProps) {
  return (
    <View style={styles.container}>
      <Image
        src={`/assets/icons/${RESUME_ICON_NAMES[type]}.jpg`}
        style={styles.icon}
      />
      <ResumeContentItem content={content} type={type} />
    </View>
  );
}
