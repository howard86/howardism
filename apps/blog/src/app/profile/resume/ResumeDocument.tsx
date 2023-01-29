"use client"

import { ReactNode } from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import dynamic from "next/dynamic"

import ResumeContact, { ResumeIconType } from "./ResumeContactList"
import { ResumeSchema } from "./schema"
import { generateStringArray } from "./utils"

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
    padding: "10%",
    fontFamily: "Times-Roman",
    fontSize: 10,
  },

  sectionContainer: { marginTop: 16 },
  sectionItemContainer: { marginTop: 2, marginBottom: 4 },

  sectionItemDescription: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
  },
  sectionItemDescriptionSymbol: {
    width: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: "#334155",
  },

  skillTitle: { width: 64, fontSize: 11, fontFamily: "Times-Bold" },
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

interface SectionItemDescriptionProps {
  descriptions: string
}

function SectionItemDescription({ descriptions }: SectionItemDescriptionProps) {
  return (
    <View>
      {generateStringArray(descriptions).map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <View style={styles.sectionItemDescription} key={item + index}>
          <Text style={styles.sectionItemDescriptionSymbol}>•</Text>
          <Text>{item}</Text>
        </View>
      ))}
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
        <Page size="A4" style={styles.page}>
          <View style={styles.flexBetween}>
            <View style={{ width: "100%" }}>
              <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold" }}>{name}</Text>
              <Text style={{ marginTop: 4 }}>{summary}</Text>
            </View>
            <View style={{ width: 120, marginLeft: 10 }}>
              <ResumeContact type={ResumeIconType.address} content={address} />
              <ResumeContact type={ResumeIconType.phone} content={phone} />
              <ResumeContact type={ResumeIconType.email} content={email} />
              <ResumeContact type={ResumeIconType.gitHub} content={github} />
              <ResumeContact type={ResumeIconType.website} content={website} />
            </View>
          </View>
          <View>
            {skills.length > 0 && (
              <SectionContainer title="Skill">
                {skills.map((skill) => (
                  <View style={styles.flexStart} key={skill.id || skill.title}>
                    <Text style={styles.skillTitle}>{skill.title}</Text>
                    <Text>{skill.items.replaceAll("\n", ", ")}</Text>
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
                      <Text style={{ fontFamily: "Times-Bold", fontSize: 12, marginBottom: 1 }}>
                        {experience.company}
                      </Text>
                      <Text>
                        {experience.startDate} - {experience.endDate || "Present"}
                      </Text>
                    </View>
                    <View style={styles.flexBetween}>
                      <View
                        style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}
                      >
                        <Text>{experience.title}</Text>
                        <Text style={{ fontFamily: "Times-Italic", marginLeft: 2, fontSize: 10 }}>
                          — team size: {experience.size}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: "Times-Italic" }}>{experience.location}</Text>
                    </View>
                    <SectionItemDescription descriptions={experience.items} />
                  </View>
                ))}
              </SectionContainer>
            )}
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
                        {education.startDate} - {education.endDate}
                      </Text>
                    </View>
                    <SectionItemDescription descriptions={education.items} />
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
                        {project.title}
                      </Text>
                      <Text>— {project.subtitle}</Text>
                    </View>
                    <SectionItemDescription descriptions={project.items} />
                  </View>
                ))}
              </SectionContainer>
            )}
          </View>
        </Page>
      </Document>
    </DynamicPDFViewer>
  )
}
