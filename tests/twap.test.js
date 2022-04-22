const Twap = require("../twap");

beforeAll(() => {
    jest.useFakeTimers('modern');
});

afterAll(() => {
    jest.useRealTimers();
});

const MakeNum = (multiplier, decimals) => {
    return {multiplier, decimals}
}


test('Test_TwapUpdatePrices', () => {
    const twap = new Twap();

    // Test two tickers
    jest.setSystemTime(new Date(10000));
    twap.updatePrices(["t1", "t2"], {"t1": MakeNum(10000, 1), "t2": MakeNum(20000, 1)});
    var shouldBe = {
        "t1": [
            {
                "price": MakeNum(10000, 1),
                "timestamp": 10000,
                "cumulative": 0
            }
        ],
        "t2": [
            {
                "price": MakeNum(20000, 1),
                "timestamp": 10000,
                "cumulative": 0
            }
        ]
    };
    expect(twap.twap_history).toEqual(shouldBe);

    // Test appending prices
    jest.setSystemTime(new Date(10001));
    var shouldBe = {
        "t1": [
            {
                "price": MakeNum(10000, 1),
                "timestamp": 10000,
                "cumulative": 0
            },
            {
                "price": MakeNum(30000, 1),
                "timestamp": 10001,
                "cumulative": 30000
            }
        ],
        "t2": [
            {
                "price": MakeNum(20000, 1),
                "timestamp": 10000,
                "cumulative": 0
            }
        ]
    };
    twap.updatePrices(["t1"], {"t1": MakeNum(30000, 1)});
    expect(twap.twap_history).toEqual(shouldBe);

    // Test appending prices
    jest.setSystemTime(new Date(10060));
    var shouldBe = {
        "t1": [
            {
                "price": MakeNum(10000, 1),
                "timestamp": 10000,
                "cumulative": 0
            },
            {
                "price": MakeNum(30000, 1),
                "timestamp": 10001,
                "cumulative": 30000
            },
            {
                "price": MakeNum(30003, 1),
                "timestamp": 10060,
                "cumulative": 1800177
            }
        ],
        "t2": [
            {
                "price": MakeNum(20000, 1),
                "timestamp": 10000,
                "cumulative": 0
            }
        ]
    };
    twap.updatePrices(["t1"], {"t1": MakeNum(30003, 1)});
    expect(twap.twap_history).toEqual(shouldBe);

    // Test removing old prices
    jest.setSystemTime(new Date(90000));
    var shouldBe = {
        "t1": [
            {
                "price": MakeNum(40000, 1),
                "timestamp": 90000,
                "cumulative": 0
            }
        ],
        "t2": [
            {
                "price": MakeNum(20000, 1),
                "timestamp": 10000,
                "cumulative": 0
            }
        ]
    };
    twap.updatePrices(["t1"], {"t1": MakeNum(40000, 1)});
    expect(twap.twap_history).toEqual(shouldBe);

    // Test removing old prices (time delta is 59 seconds)
    jest.setSystemTime(new Date(149999));
    var shouldBe = {
        "t1": [
            {
                "price": MakeNum(40000, 1),
                "timestamp": 90000,
                "cumulative": 0
            },
            {
                "price": MakeNum(40000, 1),
                "timestamp": 149999,
                "cumulative": 2399960000
            }
        ],
        "t2": [
            {
                "price": MakeNum(40000, 1),
                "timestamp": 149999,
                "cumulative": 0
            }
        ]
    };
    twap.updatePrices(["t1", "t2"], {"t1": MakeNum(40000, 1), "t2": MakeNum(40000, 1)});
    expect(twap.twap_history).toEqual(shouldBe);

    // Test removing old prices (time delta is 60 seconds)
    jest.setSystemTime(new Date(150000));
    var shouldBe = {
        "t1": [
            {
                "price": MakeNum(40000, 1),
                "timestamp": 149999,
                "cumulative": 2399960000
            },
            {
                "price": MakeNum(40000, 1),
                "timestamp": 150000,
                "cumulative": 2400000000
            }
        ],
        "t2": [
            {
                "price": MakeNum(40000, 1),
                "timestamp": 149999,
                "cumulative": 0
            },
            {
                "price": MakeNum(40000, 1),
                "timestamp": 150000,
                "cumulative": 40000
            }
        ]
    };
    twap.updatePrices(["t1", "t2"], {"t1": MakeNum(40000, 1), "t2": MakeNum(40000, 1)});
    expect(twap.twap_history).toEqual(shouldBe);
});

test('Test_GetPrice', () => {
    const twap = new Twap();

    // Test empty TWAP history
    var shouldBe = MakeNum(0, 0);
    expect(twap.getPrice("t1")).toEqual(shouldBe);

    // Test the case when TWAP contains only one item
    jest.setSystemTime(new Date(10000));
    var shouldBe = MakeNum(1234, 1);
    twap.updatePrice("t1", shouldBe);
    expect(twap.getPrice("t1")).toEqual(shouldBe);

    // Test the case when the time delta between the oldest and the newest items
    // is less than 50 sec
    jest.setSystemTime(new Date(11000));
    var shouldBe = MakeNum(5, 1);
    twap.updatePrice("t1", shouldBe);
    expect(twap.getPrice("t1")).toEqual(shouldBe);

    // Test the case when the time delta between the oldest and the newest items
    // is 50 sec
    jest.setSystemTime(new Date(60000));
    twap.updatePrice("t1", MakeNum(6, 1));
    var shouldBe = MakeNum(5.98, 1);
    expect(twap.getPrice("t1")).toEqual(shouldBe);

    // Test the case when the time delta between the oldest and the newest items
    // is more than 60 sec
    jest.setSystemTime(new Date(70000));
    twap.updatePrice("t1", MakeNum(7, 1));
    var shouldBe = MakeNum(6.169491525423729, 1);
    expect(twap.getPrice("t1")).toEqual(shouldBe);
});

test('Test_GetPrices', () => {
    const twap = new Twap();

    jest.setSystemTime(new Date(10000));
    twap.updatePrice("t1", MakeNum(12345, 1));
    twap.updatePrice("t2", MakeNum(321, 1));

    jest.setSystemTime(new Date(45000));
    twap.updatePrice("t1", MakeNum(7123, 1));
    twap.updatePrice("t2", MakeNum(6123, 1));

    var shouldBe = {
        "t1": MakeNum(7123, 1),
        "t2": MakeNum(6123, 1)
    }
    expect(twap.getPrices(["t1", "t2"])).toEqual(shouldBe);

    jest.setSystemTime(new Date(65000));
    twap.updatePrice("t1", MakeNum(9123, 1));
    twap.updatePrice("t2", MakeNum(8123, 1));

    var shouldBe = {
        "t1": MakeNum(7850.272727272727, 1),
        "t2": MakeNum(6850.272727272727, 1)
    }
    expect(twap.getPrices(["t1", "t2"])).toEqual(shouldBe);
});