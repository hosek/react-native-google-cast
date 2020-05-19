#import <GoogleCast/GoogleCast.h>
#import "RNGoogleCastButton.h"

@implementation RNGoogleCastButton
{
  GCKUICastButton *_castButton;
  UIColor *_tintColor;
  BOOL *_showDefaultDialog;

}

-(void)layoutSubviews {
  _castButton = [[GCKUICastButton alloc] initWithFrame:self.bounds];
  _castButton.tintColor = _tintColor;
  _castButton.triggersDefaultCastDialog = _showDefaultDialog;
  [self addSubview:_castButton];
}

-(void)setTintColor:(UIColor *)color {
  _tintColor = color;
  super.tintColor = color;
  [self setNeedsDisplay];
}

-(void)triggersDefaultCastDialog:(BOOL *) useDefault {
  _showDefaultDialog = useDefault;
}

@end
