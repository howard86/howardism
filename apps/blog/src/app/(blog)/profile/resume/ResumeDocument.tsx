"use client"

import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import dynamic from "next/dynamic"
import type { ComponentProps, ReactNode } from "react"
import ReactMarkdown from "react-markdown"

import ResumeContact, { ResumeIconType } from "./ResumeContactList"
import { ResumeSchema } from "./schema"
import { convertDateString } from "./utils"

const DynamicPDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((module) => module.PDFViewer),
  { ssr: false }
)

// TODO: make style dynamic
const styles = StyleSheet.create({
  flexStart: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  flexCenter: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  flexBetween: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  page: {
    position: "relative",
    paddingHorizontal: "10%",
    paddingVertical: "10%",
    fontFamily: "Times-Roman",
    fontSize: 11,
  },
  pageNote: {
    fontFamily: "Helvetica",
    position: "absolute",
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },

  sectionContainer: { marginTop: "12pt", marginBottom: "6pt" },
  sectionItemContainer: { marginTop: "6pt" },

  sectionItemDescription: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3.5,
  },
  sectionItemDescriptionSymbol: {
    width: 10,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    color: "grey",
  },

  skillSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: 1.5,
  },
  skillTitle: { width: 80, fontSize: 12, fontFamily: "Times-Bold" },
})

interface SectionContainerProps {
  title: string
  children: ReactNode
}

function SectionContainer({ title, children }: SectionContainerProps) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  )
}

interface ResumeMarkdownDescriptionProps {
  content: string
}

const markdownComponents: ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <Text>{children}</Text>,
  ul: ({ children }) => <View>{children}</View>,
  li: ({ children }) => (
    <View style={styles.sectionItemDescription}>
      <Text style={styles.sectionItemDescriptionSymbol}>•</Text>
      <Text>{children}</Text>
    </View>
  ),
  // eslint-disable-next-line jsx-a11y/anchor-is-valid
  a: ({ children, href }) => (href ? <Link src={href}>{children}</Link> : <Text>{children}</Text>),
}

function ResumeMarkdownDescription({ content }: ResumeMarkdownDescriptionProps) {
  return <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
}

interface CompanyTitleProps {
  href?: string
  name: string
  subtitle?: string
}

function CompanyTitle({ href, name, subtitle }: CompanyTitleProps) {
  return (
    <View style={styles.flexCenter}>
      <Text style={{ fontFamily: "Times-Bold", fontSize: 12, marginBottom: 1.5 }}>
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        {href ? <Link src={href}>{name}</Link> : name}
      </Text>
      {subtitle && <Text style={{ fontFamily: "Times-Italic", marginLeft: 4 }}> — {subtitle}</Text>}
    </View>
  )
}

export default function ResumeDocument({
  name,
  summary,
  address,
  phone,
  email,
  github,
  website,
  experiences,
  projects,
  educations,
  skills,
}: ResumeSchema) {
  return (
    <DynamicPDFViewer width="100%" height="100%" style={{ minHeight: "11.69in" }}>
      <Document
        author={name}
        keywords="awesome, resume, start wars"
        subject="The resume of Luke Skywalker"
        title="Resume"
      >
        <Page size="A4" style={styles.page} wrap>
          <View wrap={false}>
            <View style={styles.flexBetween}>
              <View style={{ width: "100%" }}>
                <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold" }}>{name}</Text>
                <Text style={{ marginTop: 4 }}>{summary}</Text>
              </View>
              <View style={{ width: 160, marginLeft: 20 }}>
                <ResumeContact type={ResumeIconType.address} content={address} />
                <ResumeContact type={ResumeIconType.phone} content={phone} />
                <ResumeContact type={ResumeIconType.email} content={email} />
                <ResumeContact type={ResumeIconType.github} content={github} />
                <ResumeContact type={ResumeIconType.website} content={website} />
              </View>
            </View>
            {skills.length > 0 && (
              <SectionContainer title="Skill">
                {skills.map((skill) => (
                  <View style={styles.skillSection} key={skill.id || skill.title}>
                    <Text style={styles.skillTitle}>{skill.title}</Text>
                    <View>
                      {skill.items.split("\n").map((item) => (
                        <Text key={item}>{item}</Text>
                      ))}
                    </View>
                  </View>
                ))}
              </SectionContainer>
            )}
            {experiences.length > 0 && (
              <SectionContainer title="Experience">
                {experiences.map((experience) => (
                  <View
                    key={experience.id || experience.company + experience.title}
                    style={styles.sectionItemContainer}
                  >
                    <View style={styles.flexBetween}>
                      <CompanyTitle
                        href={experience.companyUrl}
                        name={experience.company}
                        subtitle={experience.companyDescription}
                      />
                      <Text>
                        {convertDateString(experience.startDate)} -{" "}
                        {experience.endDate ? convertDateString(experience.endDate) : "Present"}
                      </Text>
                    </View>
                    <View style={styles.flexBetween}>
                      <View style={styles.flexCenter}>
                        <Text>{experience.title}</Text>
                        {experience.size && (
                          <Text
                            style={{
                              fontFamily: "Times-Italic",
                              marginLeft: 2,
                              fontSize: 10,
                            }}
                          >
                            — team size: {experience.size}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontFamily: "Times-Italic" }}>{experience.location}</Text>
                    </View>
                    {experience.description && (
                      <ResumeMarkdownDescription content={experience.description} />
                    )}
                  </View>
                ))}
              </SectionContainer>
            )}
          </View>
          <View wrap={false}>
            {educations.length > 0 && (
              <SectionContainer title="Education">
                {educations.map((education) => (
                  <View
                    key={education.id || education.facility + education.degree}
                    style={styles.sectionItemContainer}
                  >
                    <View style={styles.flexBetween}>
                      <View style={styles.flexStart}>
                        <Text style={{ fontFamily: "Times-Bold", fontSize: 12 }}>
                          {education.facility}
                        </Text>
                        <Text>, {education.degree}</Text>
                      </View>
                      <Text>
                        {convertDateString(education.startDate)} -{" "}
                        {convertDateString(education.endDate)}
                      </Text>
                    </View>
                    {education.description && (
                      <ResumeMarkdownDescription content={education.description} />
                    )}
                  </View>
                ))}
              </SectionContainer>
            )}
            {projects.length > 0 && (
              <SectionContainer title="Project">
                {projects.map((project) => (
                  <View
                    key={project.id || project.title + project.subtitle}
                    style={styles.sectionItemContainer}
                  >
                    <View style={styles.flexStart}>
                      <Text style={{ fontFamily: "Times-Bold", fontSize: 12 }}>
                        {project.title}{" "}
                      </Text>
                      <Text>— {project.subtitle}</Text>
                    </View>
                    {project.description && (
                      <ResumeMarkdownDescription content={project.description} />
                    )}
                  </View>
                ))}
              </SectionContainer>
            )}
          </View>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Howard Tai - Full Stack Engineer (${pageNumber}/${totalPages})`
            }
            style={styles.pageNote}
            fixed
          />
        </Page>
      </Document>
    </DynamicPDFViewer>
  )
}
