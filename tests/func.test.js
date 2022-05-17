const { IsDifferentEnough, GetMedianPrice, GetAvgPrice } = require("./../functions");

const MakeNum = (multiplier, decimals) => {
  return { multiplier, decimals };
};

test("Test GetAvgPrice", () => {
    expect(GetAvgPrice(20, 30, 25)).toBe(25);
    expect(GetAvgPrice(20, 30, 40)).toBe(30);
    expect(GetAvgPrice(20, 30, 10)).toBe(20);
    expect(GetAvgPrice(0, 30, 10)).toBe(0);
    expect(GetAvgPrice(20, 0, 10)).toBe(0);
    expect(GetAvgPrice(0, 0, 0)).toBe(0);
    expect(GetAvgPrice("20", "30", "25")).toBe(25);
    expect(GetAvgPrice("20", "30", "40")).toBe(30);
    expect(GetAvgPrice("20", "30", "10")).toBe(20);
    expect(GetAvgPrice(30, 20, 25)).toBe(0);
});

test("Test IsDifferentEnough", () => {
  const relDiff = 0.005;
  expect(IsDifferentEnough(relDiff, MakeNum(10, 0), MakeNum(11, 0))).toBe(true);
  expect(IsDifferentEnough(relDiff, MakeNum(11, 0), MakeNum(10, 0))).toBe(true);
  expect(IsDifferentEnough(relDiff, MakeNum(11, 0), MakeNum(11, 0))).toBe(
    false
  );

  expect(IsDifferentEnough(relDiff, MakeNum(10, 10), MakeNum(11, 10))).toBe(
    true
  );
  expect(IsDifferentEnough(relDiff, MakeNum(11, 10), MakeNum(10, 10))).toBe(
    true
  );
  expect(IsDifferentEnough(relDiff, MakeNum(11, 10), MakeNum(11, 10))).toBe(
    false
  );

  expect(IsDifferentEnough(relDiff, MakeNum(100, 10), MakeNum(10, 9))).toBe(
    false
  );
  expect(IsDifferentEnough(relDiff, MakeNum(10, 9), MakeNum(100, 10))).toBe(
    false
  );

  expect(IsDifferentEnough(relDiff, MakeNum(101, 10), MakeNum(10, 9))).toBe(
    true
  );
  expect(IsDifferentEnough(relDiff, MakeNum(10, 9), MakeNum(101, 10))).toBe(
    true
  );
  expect(IsDifferentEnough(relDiff, MakeNum(99, 10), MakeNum(10, 9))).toBe(
    true
  );
  expect(IsDifferentEnough(relDiff, MakeNum(10, 9), MakeNum(99, 10))).toBe(
    true
  );

  expect(IsDifferentEnough(relDiff, MakeNum(101, 40), MakeNum(10, 0))).toBe(
    true
  );
  expect(IsDifferentEnough(relDiff, MakeNum(10, 0), MakeNum(101, 40))).toBe(
    true
  );

  expect(IsDifferentEnough(relDiff, MakeNum(101, 40), MakeNum(10100, 42))).toBe(
    false
  );
  expect(
    IsDifferentEnough(
      relDiff,
      MakeNum(100000000000000000000, 20),
      MakeNum(10, 1)
    )
  ).toBe(false);
});

test("Test GetMedianPrice", () => {
  expect(
    GetMedianPrice(
      [
        { ticker: 1.2 },
        { ticker: 1.3 },
        { ticker: 1.4 },
        { ticker: 1.5 },
        { ticker: 1.6 },
      ],
      "ticker"
    )
  ).toBe(1.4);

  expect(
    GetMedianPrice(
      [
        { ticker: 110.2 },
        { ticker: 210.3 },
        { ticker: 310.4 },
        { ticker: 410.5 },
        { ticker: 510.6 },
      ],
      "ticker"
    )
  ).toBe(310.4);

  expect(
    GetMedianPrice(
      [
        { ticker: 110.2 },
        { ticker: 210.3 },
        { ticker: 310.4 },
        { ticker: 410.5 },
      ],
      "ticker"
    )
  ).toBe((210.3 + 310.4) / 2);

  expect(GetMedianPrice([], "ticker")).toBe(0);

  expect(GetMedianPrice([{ ticker: 1 }], "ticker")).toBe(1);
});
