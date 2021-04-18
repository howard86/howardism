export interface Recipe {
  id: string;
  food: string[];
  seasonings: string[];
  steps: Step[];
}

export interface Step {
  summary: string;
  description: string;
}

const RECIPES: Recipe[] = [
  {
    id: "1",
    food: [
      "牛肋兩條切塊",
      "牛腱一公斤切長條",
      "洋蔥一顆逆紋切",
      "牛蕃茄一顆切大塊",
      "白蘿蔔半條切塊",
      "蒜頭10顆",
      "蔥三支切段",
      "薑片三四片",
    ],
    seasonings: [
      "沙拉油2大匙",
      "八角兩個",
      "花椒粒2小匙",
      "醬油2大匙(最多100mL)",
      "冰糖3大匙",
      "米酒3大匙",
      "豆瓣2.5大匙",
      "番茄醬3大匙",
      "辣椒斟酌",
    ],
    steps: [
      {
        summary: "備料",
        description: "牛肋條及牛腱去除筋膜及多餘脂肪；用熱開水將番茄去皮；滾刀切白蘿蔔；蒜頭拍碎",
      },
      {
        summary: "爆香",
        description: "下油爆香薑片蒜頭八角，煎至微黃再下蔥段炒香",
      },
      {
        summary: "將牛肉上色",
        description: "加入牛肉們炒至肉變色，不用炒到熟，將牛肉們移出",
      },
      {
        summary: "炒軟洋蔥及番茄",
        description: "下洋蔥炒軟並變色，再加入蕃茄翻炒",
      },
      {
        summary: "炒糖調醬汁",
        description: "放冰糖炒出焦糖，再放醬油並確定煮開，一定要煮過味道才會進去",
      },
      {
        summary: "翻炒",
        description: "加回牛肉，放入剩餘調味料翻炒一下",
      },
      {
        summary: "加入蘿蔔",
        description: "煮滾後加蘿蔔再加清水至淹過牛肉",
      },
      {
        summary: "悶軟入味",
        description: "以小火燉煮一小時，再關火燜半小時，放置隔夜",
      },
    ],
  },
  {
    id: "2222",
    food: [],
    seasonings: [],
    steps: [],
  },
];

export const getRecipeById = (id: string): Recipe | null => {
  const recipe = RECIPES.find((item) => item.id === id);

  if (!recipe) {
    return null;
  }

  return recipe;
};
