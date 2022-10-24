import ReactMarkdown, { Options } from "react-markdown";
import { Box, chakra, Divider, Flex, Heading, List } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";

import profilePicture from "@/../public/profile.jpeg";
import { SectionId } from "@/constants/nav";
import { GetHomePageQuery } from "@/services/query.generated";

import SlideBox from "../animations/SlideBox";

import SectionWrapper from "./SectionWrapper";

interface AboutListItemProps {
  index: number;
  title?: string;
  description?: string;
}

function AboutListItem({ title, description, index }: AboutListItemProps) {
  return (
    <SlideBox as="li" x={30} delay={0.2 + index * 0.12}>
      <chakra.span
        fontWeight="medium"
        color="gray.600"
        textTransform="capitalize"
        _after={{
          mx: 0.5,
          content: "':'",
          color: "secondary.700",
        }}
      >
        {title}
      </chakra.span>
      {description}
    </SlideBox>
  );
}

interface AboutSectionProps {
  data: GetHomePageQuery["aboutSection"];
}

const MARKDOWN_COMPONENTS: Options["components"] = {
  h3: ({ node, ...props }) => <SlideBox fontWeight="bold" as="h3" y={-20} {...props} />,
  p: ({ node, ...props }) => <SlideBox as="p" y={-20} delay={0.3} mt={2} {...props} />,
};

export default function AboutSection({ data }: AboutSectionProps) {
  return (
    <SectionWrapper
      id={SectionId.About}
      tag="about"
      title={data?.data?.attributes?.section?.title}
      description={data?.data?.attributes?.section?.title}
    >
      <Flex flexDirection={["column", "column", "row"]} justifyContent="start" gap={10}>
        <SlideBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          x={-40}
          duration={1.2}
          flexShrink={0}
        >
          <Image alt="github profile photo" src={profilePicture} rounded="sm" overflow="hidden" />
        </SlideBox>
        <Box pos="relative">
          <ReactMarkdown components={MARKDOWN_COMPONENTS}>
            {data?.data?.attributes?.introduction || ""}
          </ReactMarkdown>
          <Divider my={4} />
          <Heading>{data?.data?.attributes?.interest_title}</Heading>
          <List pos="relative" spacing={2} mt={4}>
            {data?.data?.attributes?.interest_items?.data.map((item, index) => (
              <AboutListItem
                key={item.id}
                title={item.attributes?.title}
                description={item.attributes?.description}
                index={index}
              />
            ))}
          </List>
        </Box>
      </Flex>
    </SectionWrapper>
  );
}
