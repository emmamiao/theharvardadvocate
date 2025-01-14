/** @jsxImportSource theme-ui */
import React, { useEffect, useState } from "react";
import TextContentList from "../components/TextContentList.js";
import sanityClient from "../client.js";
import { useParams } from "react-router-dom";
import SectionFrame from "../components/SectionFrame";
import ColorRingLoader from "../components/LoadingRing.js";
import ImageContentGrid from "../components/ImageContentGrid.js";

const sectionSx = {
  ".sectionHeader": {
    fontStyle: "italic",
    borderBottom: "1px solid #000",
    h2: { display: "inline-block", marginRight: "0.4em" },
    img: { height: "0.6em", display: "inline-block" },
  },
};

const virtualStyle = {
  position: "absolute",
  height: "200px",
  top: "-200px",
  width: "100%",
  pointerEvent: "none",
};

const sectionToQuery = (section, start, end) =>
  `*[_type == "contentItem" && "${section}" in sections[]->title]  | order(publishedAt desc) {
        title,
        authors[]->{name, slug},
        issue->{title,slug},
        sections[]->{title,slug},
        slug,
        body,
        mainImage{
          asset->{
          _id,
          url
          }
        },
        images[]{asset->{_id, url}}
    }[${start}...${end}]`;

export default function Section(props) {
  const [items, setItems] = useState(null);
  const [section, setSection] = useState("");
  const { sectionSlug } = useParams();

  const loadItems = (num) => {
    var currentPost = 0;
    if (items) {
      currentPost = items.length;
    }
    sanityClient
      .fetch(sectionToQuery(section, currentPost, currentPost + num)) // query section
      .then((data) => setItems([...items, ...data]))
      .catch(console.error);
  };
  useEffect(() => {
    sanityClient
      .fetch(`*[_type == "section" && slug.current == $sectionSlug]`, {
        // fetch section data to get section name
        sectionSlug,
      })
      .then((sectionData) => {
        setSection(sectionData[0].title); // set section name
        sanityClient
          .fetch(sectionToQuery(sectionData[0].title, 0, 24)) // query section
          .then((data) => setItems(data))
          .catch(console.error);
      })
      .catch(console.error);
  }, [sectionSlug]);

  const intersectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].intersectionRatio === 0) return;
    loadItems(9);
  });

  useEffect(() => {
    const currentElement = document.querySelector(".more");
    if (currentElement) {
      intersectionObserver.observe(currentElement);
    }
    return () => {
      if (currentElement) {
        intersectionObserver.unobserve(currentElement);
      }
    };
  });

  if (!items) {
    return <ColorRingLoader />;
  }

  return (
    <div sx={sectionSx}>
      <SectionFrame
        path={[
          {
            name: section,
            slug: "/sections/{section}",
          },
        ]}
      >
        {sectionSlug === "art" ? (
          <ImageContentGrid items={items} />
        ) : (
          <TextContentList
            items={items}
            home={false}
            border={true}
          ></TextContentList>
        )}
      </SectionFrame>
      <div className="more">
        <p style={virtualStyle}></p>
      </div>
    </div>
  );
}
