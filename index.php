<?php

$options = array(
    // which string should represent a tab for indentation
    'tab' => '    ',
);
/**
 * PHP Console
 *
 * A web-based php debug console
 *
 * Copyright (C) 2010, Jordi Boggiano
 * http://seld.be/ - j.boggiano@seld.be
 *
 * Licensed under the new BSD License
 * See the LICENSE file for details
 *
 * Source on Github http://github.com/Seldaek/php-console
 */
if (!in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1'), true)) {
    header('HTTP/1.1 401 Access unauthorized');
    die('ERR/401 Go Away');
}

define('PHP_CONSOLE_VERSION', '1.2.0-dev');
require 'krumo/class.krumo.php';

ini_set('log_errors', 0);
ini_set('display_errors', 1);
error_reporting(E_ALL | E_STRICT);

$debugOutput = '';
chdir('/var/www/drupal/hav002/site');
define('DONSOLE', TRUE);
/**
 * Root directory of Drupal installation.
 */
define('DRUPAL_ROOT', getcwd());
require_once DRUPAL_ROOT . '/includes/bootstrap.inc';
drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);

if (isset($_POST['code'])) {
    $code = $_POST['code'];

    if (get_magic_quotes_gpc()) {
        $code = stripslashes($code);
    }

    // if there's only one line wrap it into a krumo() call
    if (preg_match('#^(?!var_dump|echo|print|< )([^\r\n]+?);?\s*$#is', $code, $m) && trim($m[1])) {
        $code = 'krumo('.$m[1].');';
    }

    // replace '< foo' by krumo(foo)
    $code = preg_replace('#^<\s+(.+?);?[\r\n]?$#m', 'krumo($1);', $code);

    // replace newlines in the entire code block by the new specified one
    // i.e. put #\r\n on the first line to emulate a file with windows line
    // endings if you're on a unix box
    if (preg_match('{#((?:\\\\[rn]){1,2})}', $code, $m)) {
        $newLineBreak = str_replace(array('\\n', '\\r'), array("\n", "\r"), $m[1]);
        $code = preg_replace('#(\r?\n|\r\n?)#', $newLineBreak, $code);
    }

    ob_start();
    eval($code);
    $debugOutput = ob_get_clean();

    if (isset($_GET['js'])) {
        header('Content-Type: text/plain');
        echo $debugOutput;
        die('#end-php-console-output#');
    }
}

?>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <title>Debug Console</title>
        <link rel="stylesheet" type="text/css" href="styles.css" />
        <script type="text/javascript" src="jquery-1.4.2.min.js"></script>
        <script type="text/javascript" src="jquery.selections.js"></script>
        <script type="text/javascript" src="php-console.js"></script>
        <script type="text/javascript">
            $.console({
                tab: <?php echo json_encode($options['tab']) ?>
            });
        </script>
    </head>
    <body>
        <div class="output"><?php echo $debugOutput ?></div>
        <form method="POST" action="">
            <textarea cols="100" rows="20" name="code"><?php echo (isset($_POST['code']) ? htmlentities($_POST['code'], ENT_QUOTES, 'UTF-8') : null) ?></textarea>
            <div class="statusbar">Line: 1, Column: 1</div>
            <input type="submit" name="subm" value="Try this!" />
        </form>
        <div class="help">
        debug:
            &lt; foo()
            krumo(foo());
        </div>
        <div class="help">
        commands:
            krumo::backtrace();
            krumo::includes();
            krumo::functions();
            krumo::classes();
            krumo::defines();
        </div>
        <div class="help">
        misc:
            press ctrl-enter to submit
            put '#\n' on the first line to enforce
                \n line breaks (\r\n etc work too)
        </div>
        <div class="footer">
            php-console v<?php echo PHP_CONSOLE_VERSION ?> - by <a href="http://seld.be/">Jordi Boggiano</a> - <a href="http://github.com/Seldaek/php-console">sources on github</a>
        </div>
    </body>
</html>
