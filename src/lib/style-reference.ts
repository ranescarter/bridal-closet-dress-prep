export type StyleReferenceItem = {
  filterId: string;
  description: string;
};

export type StyleReferenceSection = {
  id: string;
  label: string;
  introduction: string;
  items: StyleReferenceItem[];
};

export const STYLE_REFERENCE_SECTIONS: StyleReferenceSection[] = [
  {
    id: "silhouettes",
    label: "Silhouettes",
    introduction:
      "Silhouette describes the overall shape of a gown from the bodice through the skirt.",
    items: [
      {
        filterId: "a-line",
        description:
          "Fitted through the bodice, then gradually widens toward the hem in an A shape.",
      },
      {
        filterId: "ball-gown",
        description:
          "A fitted bodice paired with a full, dramatic skirt for a classic bridal shape.",
      },
      {
        filterId: "mermaid",
        description:
          "Follows the body through the hips before flaring into a fuller skirt.",
      },
    ],
  },
  {
    id: "necklines-straps",
    label: "Necklines & straps",
    introduction:
      "Necklines and straps frame the shoulders, collarbone, and upper bodice.",
    items: [
      {
        filterId: "off-shoulder",
        description:
          "Sleeves or straps sit below the shoulders, leaving the collarbone open.",
      },
      {
        filterId: "spaghetti",
        description:
          "Narrow straps create a light, delicate look while supporting the bodice.",
      },
      {
        filterId: "strapless",
        description:
          "A bodice without shoulder straps, leaving the shoulders and neckline open.",
      },
      {
        filterId: "sweetheart",
        description:
          "A curved neckline with two rounded peaks that resemble the top of a heart.",
      },
      {
        filterId: "v-neck",
        description:
          "The neckline slopes down toward the center of the bodice in a V shape.",
      },
    ],
  },
  {
    id: "sleeves-coverage",
    label: "Sleeves & coverage",
    introduction:
      "Explore sleeve lengths and options that offer different amounts of coverage.",
    items: [
      {
        filterId: "cap-sleeve",
        description:
          "A short sleeve that just covers the top of the shoulder.",
      },
      {
        filterId: "long-sleeve",
        description:
          "Sleeves extend toward the wrist and may be lace, sheer, or lined.",
      },
      {
        filterId: "modest",
        description:
          "Gowns designed with additional coverage through the neckline, bodice, or sleeves.",
      },
      {
        filterId: "temple-ready",
        description:
          "Gowns tagged by Bridal Closet as meeting its temple-ready coverage guidelines.",
      },
    ],
  },
  {
    id: "details",
    label: "Details",
    introduction:
      "These design elements can change the texture, structure, and personality of a gown.",
    items: [
      {
        filterId: "corset",
        description:
          "A structured bodice inspired by corsetry, often with visible boning or lacing.",
      },
      {
        filterId: "lace",
        description:
          "A decorative fabric that can appear as delicate appliqués or cover much of the gown.",
      },
      {
        filterId: "slit",
        description:
          "An opening in the skirt that adds movement and reveals part of the leg.",
      },
    ],
  },
];
