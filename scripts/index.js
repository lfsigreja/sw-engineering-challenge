const { randomUUID } = require("crypto");
const fs = require("fs");

const generateBloq = ({ title, address }) => ({
  id: randomUUID(),
  title,
  address,
});

const bloqs = [
  generateBloq({
    title: "Luitton Vouis Champs Elysées",
    address: "101 Av. des Champs-Élysées, 75008 Paris, France",
  }),
  generateBloq({
    title: "Riod Eixample",
    address: "Pg. de Gràcia, 74, L'Eixample, 08008 Barcelona, Spain",
  }),
  generateBloq({
    title: "Bluberry Regent Street",
    address: "121 Regent St, Mayfair, London W1B 4TB, United Kingdom",
  }),
];

const locker1 = {
  id: randomUUID(),
  bloqId: bloqs[0].id,
  status: "OPEN",
  isOccupied: false,
};

const locker4 = {
  id: randomUUID(),
  bloqId: bloqs[1].id,
  status: "OPEN",
  isOccupied: false,
};

const locker9 = {
  id: randomUUID(),
  bloqId: bloqs[2].id,
  status: "OPEN",
  isOccupied: false,
};

const lockers = [
  locker1,
  {
    id: randomUUID(),
    bloqId: bloqs[0].id,
    status: "OPEN",
    isOccupied: false,
  },
  {
    id: randomUUID(),
    bloqId: bloqs[0].id,
    status: "OPEN",
    isOccupied: false,
  },
  locker4,
  {
    id: randomUUID(),
    bloqId: bloqs[1].id,
    status: "OPEN",
    isOccupied: false,
  },
  {
    id: randomUUID(),
    bloqId: bloqs[1].id,
    status: "OPEN",
    isOccupied: false,
  },
  {
    id: randomUUID(),
    bloqId: bloqs[2].id,
    status: "OPEN",
    isOccupied: false,
  },
  {
    id: randomUUID(),
    bloqId: bloqs[2].id,
    status: "OPEN",
    isOccupied: false,
  },
  locker9,
];

const rents = [
  {
    id: randomUUID(),
    lockerId: locker9.id,
    weight: 5,
    size: "M",
    status: "CREATED",
  },
  {
    id: randomUUID(),
    lockerId: locker1.id,
    weight: 7,
    size: "L",
    status: "WAITING_PICKUP",
  },
  {
    id: randomUUID(),
    lockerId: locker4.id,
    weight: 10,
    size: "XL",
    status: "WAITING_DROPOFF",
  },
  {
    id: randomUUID(),
    lockerId: locker4.id,
    weight: 30,
    size: "XL",
    status: "DELIVERED",
  },
];

fs.writeFileSync("bloqs.json", JSON.stringify(bloqs, null, 2), "utf8");
fs.writeFileSync("lockers.json", JSON.stringify(lockers, null, 2), "utf8");
fs.writeFileSync("rents.json", JSON.stringify(rents, null, 2), "utf8");
