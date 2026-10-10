export enum Nationality {
  American = "American",
  British = "British"
}

export const NationalityFlags: Record<Nationality, string> = {
  [Nationality.American]: "🇺🇸",
  [Nationality.British]: "🇬🇧"
};

export interface VoiceOption {
  id: string;
  name: string;
  nationality: Nationality;
  url: string;
}

export const maleVoices: VoiceOption[] = [
  {
    id: "am_adam",
    name: "Adam",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/tvauhDVRGvGK98I-4wv3H.wav"
  },
  {
    id: "am_echo",
    name: "Echo",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/qy_KuUB0hXsu-u8XaJJ_Z.wav"
  },
  {
    id: "am_eric",
    name: "Eric",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/JhqPjbpMhraUv5nTSPpwD.wav"
  },
  {
    id: "am_fenrir",
    name: "Fenrir",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/c0R9caBdBiNjGUUalI_DQ.wav"
  },
  {
    id: "am_liam",
    name: "Liam",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/DFHvulaLeOjXIDKecvNG3.wav"
  },
  {
    id: "am_michael",
    name: "Michael",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/IPKhsnjq1tPh3JmHH8nEg.wav"
  },
  {
    id: "am_onyx",
    name: "Onyx",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/ov0pFDfE8NNKZ80LqW6Di.wav"
  },
  {
    id: "am_puck",
    name: "Puck",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/MOC654sLMHWI64g8HWesV.wav"
  },
  {
    id: "am_santa",
    name: "Santa",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/LzA6JmHBvQlhOviy8qVfJ.wav"
  },
  {
    id: "bm_daniel",
    name: "Daniel",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/Eb0TLnLXHDRYOA3TJQKq3.wav"
  },
  {
    id: "bm_fable",
    name: "Fable",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/NT9XkmvlezQ0FJ6Th5hoZ.wav"
  },
  {
    id: "bm_george",
    name: "George",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/y6VJbCESszLZGupPoqNkF.wav"
  },
  {
    id: "bm_lewis",
    name: "Lewis",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/RlB5BRvLt-IFvTjzQNxCh.wav"
  }
];

export const femaleVoices: VoiceOption[] = [
  {
    id: "af_heart",
    name: "Heart",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/S_9tkA75BT_QHKOzSX6S-.wav"
  },
  {
    id: "af_alloy",
    name: "Alloy",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/wiZ3gvlL--p5pRItO4YRE.wav"
  },
  {
    id: "af_aoede",
    name: "Aoede",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/Nv1xMwzjTdF9MR8v0oEEJ.wav"
  },
  {
    id: "af_bella",
    name: "Bella",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/sWN0rnKU6TlLsVdGqRktF.wav"
  },
  {
    id: "af_jessica",
    name: "Jessica",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/2Oa4wITWAmiCXJ_Q97-7R.wav"
  },
  {
    id: "af_kore",
    name: "Kore",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/AOIgyspzZWDGpn7oQgwtu.wav"
  },
  {
    id: "af_nicole",
    name: "Nicole",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/EY_V2OGr-hzmtTGrTCTyf.wav"
  },
  {
    id: "af_nova",
    name: "Nova",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/X-xdEkx3GPlQG5DK8Gsqd.wav"
  },
  {
    id: "af_river",
    name: "River",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/ZqaV2-xGUZdBQmZAF1Xqy.wav"
  },
  {
    id: "af_sarah",
    name: "Sarah",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/xzoJBl1HCvkE8Fl8Xu2R4.wav"
  },
  {
    id: "af_sky",
    name: "Sky",
    nationality: Nationality.American,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/ubebYQoaseyQk-jDLeWX7.wav"
  },
  {
    id: "bf_alice",
    name: "Alice",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/9mnYZ3JWq7f6U12plXilA.wav"
  },
  {
    id: "bf_emma",
    name: "Emma",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/_fvGtKMttRI0cZVGqxMh8.wav"
  },
  {
    id: "bf_isabella",
    name: "Isabella",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/VzlcJpqGEND_Q3duYnhiu.wav"
  },
  {
    id: "bf_lily",
    name: "Lily",
    nationality: Nationality.British,
    url: "https://cdn-uploads.huggingface.co/production/uploads/61b253b7ac5ecaae3d1efe0c/qZCoartohiRlVamY8Xpok.wav"
  }
];

export type { VoiceOption }; 