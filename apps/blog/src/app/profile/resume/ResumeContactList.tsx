/* eslint-disable jsx-a11y/anchor-is-valid */

import { Image, Link, StyleSheet, Text, View } from "@react-pdf/renderer"

export enum ResumeIconType {
  address,
  phone,
  email,
  gitHub,
  website,
}

interface ResumeContactProps {
  type: ResumeIconType
  content: string
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
})

function ResumeContentItem({ type, content }: ResumeContactProps) {
  switch (type) {
    case ResumeIconType.phone:
      return <Link src={`tel:${content}`}>{content}</Link>

    case ResumeIconType.email:
      return <Link src={`mailto:${content}`}>{content}</Link>

    case ResumeIconType.gitHub:
      return <Link src={`https://github.com/${content}`}>{content}</Link>

    case ResumeIconType.website:
      return <Link src={`https://${content}`}>{content}</Link>

    default:
      return <Text>{content}</Text>
  }
}

export default function ResumeContact({ type, content }: ResumeContactProps) {
  return (
    <View style={styles.container}>
      <Image src={`/assets/icons/${ResumeIconType[type]}.jpg`} style={styles.icon} />
      <ResumeContentItem type={type} content={content} />
    </View>
  )
}
