// simulate getting products from DataBase
const products = [
  { name: "Apples", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
];

const picsumURL = 'https://picsum.photos/id/';
const baseURL = 'http://localhost:1337/products';

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = () => {

  const { Card, Accordion, Button, Container, Row, Col, Image, Input } = ReactBootstrap;
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);


  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState(baseURL);
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    baseURL,
    {
      data: [],
    }
  );

  console.log(`Rendering Products ${JSON.stringify(data)}`);
  // Fetch Data
  const addToCart = (e) => {
    let name = e.target.name;
    let newItem = items.filter((item) => item.name == name)[0];
    if (newItem.instock == 0) return
    newItem.instock -= 1;
    console.log(`add to Cart ${JSON.stringify(newItem)}`);
    // Update stock
    setItems(
      items.map((item) => item.name === name ? newItem : item)
    );
    // Add item to cart
    setCart([...cart, newItem]);
  };

  const deleteCartItem = (index) => {
    let newCart = cart.filter((item, i) => index != i);
    let itemToDelete = cart.filter((item, i) => index === i)[0]
    setCart(newCart);

    // Update stock
    let newItem = items.filter(item => item.name == itemToDelete.name)[0]
    let name = newItem.name
    newItem.instock += 1
    setItems(
      items.map((item) => item.name === name ? newItem : item)
    )
  };

  let list = items.map((item, index) => {
    let imageURL = `${picsumURL}${index + 1049}/50/50`;

    return (
      <li key={index}>
        <Image src={imageURL} width={70} roundedCircle></Image>
        <Button variant="primary" size="large">
          {item.name}: ${item.cost}<br />
          Instock: {item.instock}
        </Button><br />
        {item.instock > 0 ?
          <input name={item.name} type="submit" className="add-to-cart" value="Add To Cart" onClick={addToCart}></input> :
          <input name={item.name} type="submit" className="add-to-cart" value="Add To Cart" disabled></input>}
      </li>
    );
  });
  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            {item.name}
          </Accordion.Toggle>
        </Card.Header>
        <Accordion.Collapse
          onClick={() => deleteCartItem(index)}
          eventKey={1 + index}
        >
          <Card.Body>
            $ {item.cost} from {item.country}
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };

  // Restock products
  const restockProducts = (url) => {
    doFetch(url);
    const restocked = data.map(product => {
      const { name, country, cost, instock } = product;
      return { name, country, cost, instock };
    });
    // Update instock
    restocked.map(dbItem => {
      items.map(item => {
        if (item.name === dbItem.name) dbItem.instock += item.instock
      })
    })
    setItems(restocked);
  };

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            restockProducts(`${query}`);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));