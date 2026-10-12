// Import styles
import "../css/index.css";
// PHP の assets_url('images/...') で参照されている画像だけ manifest に含める
import "virtual:php-images";

import { hello } from "./modules/hello";

hello();
